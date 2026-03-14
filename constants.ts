
import { Commune, DepartmentMap, StatusMap, Organization } from './types';

export const communesData: Record<Organization, Commune[]> = {
  msf: [
    { 
        id: 1, nom: 'Comm1-MSF', departement: '75', population: 25000, passage: '2024-01-15', statut: 'fait', maire: 'Anne Hidalgo', revenue: '38,540 €', lat: 48.8566, lng: 2.3522, 
        email: 'contact@mairie-paris.fr', phone: '01 42 76 40 40',
        historiquePassages: { msf: ['2024-01-15', '2023-02-10', '2022-03-05'], unicef: ['2022-05-20'], mdm: ['2021-11-11'] } 
    },
    { 
        id: 2, nom: 'Comm2-MSF', departement: '13', population: 120000, passage: '2024-03-02', statut: 'informe', maire: 'Benoît Payan', revenue: '23,120 €', lat: 43.2965, lng: 5.3698, 
        email: 'maire@marseille.fr', phone: '04 91 55 11 11',
        historiquePassages: { msf: ['2024-03-02'], wwf: ['2023-08-19', '2022-08-15'] } 
    },
    { 
        id: 3, nom: 'Comm3-MSF', departement: '69', population: 85000, passage: '2024-05-18', statut: 'pas_demande', maire: 'Grégory Doucet', revenue: '27,860 €', lat: 45.7640, lng: 4.8357,
        email: 'cabinet@mairie-lyon.fr', phone: '04 72 10 30 30',
        historiquePassages: { msf: ['2022-01-10'], mdm: ['2023-04-12'] }
    },
    { 
        id: 4, nom: 'Comm4-MSF', departement: '59', population: 42000, passage: '2024-06-22', statut: 'refuse', maire: 'Martine Aubry', revenue: '21,550 €', lat: 50.6292, lng: 3.0573,
        email: 'contact@lille.fr', phone: '03 20 49 50 00',
        historiquePassages: { unicef: ['2023-09-01'] }
    },
    { 
        id: 5, nom: 'Comm5-MSF', departement: '33', population: 11500, passage: '2024-09-01', statut: 'telescope', maire: 'Pierre Hurmic', revenue: '26,980 €', lat: 44.8378, lng: -0.5792,
        email: 'mairie@bordeaux.fr', phone: '05 56 10 20 30',
        historiquePassages: { wwf: ['2024-09-01'] } // Téléscopage
    },
    { id: 6, nom: 'Comm6-MSF', departement: '67', population: 9800, passage: '2024-10-14', statut: 'informe', maire: 'Jeanne Barseghian', revenue: '25,430 €', lat: 48.5734, lng: 7.7521, email: 'ville@strasbourg.eu', phone: '03 68 98 50 00' },
    { id: 7, nom: 'Comm7-MSF', departement: '31', population: 76000, passage: '2023-11-05', statut: 'fait', maire: 'Jean-Luc Moudenc', revenue: '26,110 €', lat: 43.6047, lng: 1.4442, email: 'contact@toulouse.fr', phone: '05 61 22 29 22' },
    { id: 8, nom: 'Comm8-MSF', departement: '44', population: 33000, passage: '2024-01-20', statut: 'pas_demande', maire: 'Johanna Rolland', revenue: '25,780 €', lat: 47.2184, lng: -1.5536, email: 'accueil@nantes.fr', phone: '02 40 41 90 00' },
    { id: 9, nom: 'Comm9-MSF', departement: '06', population: 51000, passage: '2024-04-10', statut: 'refuse', maire: 'Christian Estrosi', revenue: '24,990 €', lat: 43.7102, lng: 7.2620, email: 'maire@nice.fr', phone: '04 97 13 20 00' },
    { id: 10, nom: 'Comm10-MSF', departement: '83', population: 19000, passage: '2024-07-30', statut: 'pas_demande', maire: 'Hubert Falco', revenue: '24,150 €', lat: 43.1242, lng: 5.9280, email: 'contact@toulon.fr', phone: '04 94 36 30 00' },
  ],
  unicef: [
    { id: 11, nom: 'Comm1-UNI', departement: '92', population: 45000, passage: '2024-02-10', statut: 'informe', maire: 'Jean-Christophe Fromantin', revenue: '45,670 €', lat: 48.8787, lng: 2.2393, email: 'neuilly@neuillysurseine.fr', phone: '01 40 88 88 88', historiquePassages: { unicef: ['2024-02-10', '2023-01-15'], msf: ['2022-04-12'] } },
    { id: 12, nom: 'Comm2-UNI', departement: '93', population: 68000, passage: '2024-02-11', statut: 'telescope', maire: 'Mathieu Hanotin', revenue: '18,340 €', lat: 48.9357, lng: 2.3600, email: 'contact@saint-denis.fr', phone: '01 49 33 66 66' },
    { id: 13, nom: 'Comm3-UNI', departement: '94', population: 32000, passage: '2024-03-12', statut: 'fait', maire: 'Olivier Lefrançois', revenue: '26,890 €', lat: 48.7904, lng: 2.4494, email: 'mairie@creteil.fr', phone: '01 49 80 92 94' },
    { id: 14, nom: 'Comm4-UNI', departement: '78', population: 21000, passage: '2024-04-14', statut: 'pas_demande', maire: 'François de Mazières', revenue: '42,130 €', lat: 48.8014, lng: 2.1301, email: 'versailles@versailles.fr', phone: '01 30 97 80 00' },
    { id: 15, nom: 'Comm5-UNI', departement: '95', population: 18500, passage: '2024-05-15', statut: 'refuse', maire: 'Jean-Paul Jeandon', revenue: '22,560 €', lat: 49.0384, lng: 2.0809, email: 'cergy@cergy.fr', phone: '01 34 33 44 00' },
  ],
  wwf: [
    { id: 16, nom: 'Comm1-WWF', departement: '34', population: 11200, passage: '2024-01-05', statut: 'pas_demande', maire: 'Michaël Delafosse', revenue: '23,450 €', lat: 43.6108, lng: 3.8767, email: 'montpellier@montpellier.fr', phone: '04 67 34 70 00', historiquePassages: { wwf: ['2024-01-05'] } },
    { id: 17, nom: 'Comm2-WWF', departement: '84', population: 9500, passage: '2024-02-06', statut: 'fait', maire: 'Cécile Helle', revenue: '20,120 €', lat: 43.9493, lng: 4.8055, email: 'contact@avignon.fr', phone: '04 90 80 80 00' },
    { id: 18, nom: 'Comm3-WWF', departement: '30', population: 22000, passage: '2024-03-07', statut: 'informe', maire: 'Jean-Paul Fournier', revenue: '21,330 €', lat: 43.8367, lng: 4.3601, email: 'nimes@nimes.fr', phone: '04 66 76 70 01' },
    { id: 19, nom: 'Comm4-WWF', departement: '11', population: 7800, passage: '2024-04-08', statut: 'refuse', maire: 'Gérard Larrat', revenue: '20,980 €', lat: 43.2130, lng: 2.3491, email: 'contact@carcassonne.fr', phone: '04 68 77 71 11' },
    { id: 20, nom: 'Comm5-WWF', departement: '66', population: 13000, passage: '2024-05-09', statut: 'fait', maire: 'Louis Aliot', revenue: '20,540 €', lat: 42.6887, lng: 2.8948, email: 'mairie@perpignan.fr', phone: '04 68 66 30 66' },
  ],
  mdm: [
    { id: 21, nom: 'Comm1-MDM', departement: '35', population: 65000, passage: '2024-03-21', statut: 'fait', maire: 'Nathalie Appéré', revenue: '26,760 €', lat: 48.1173, lng: -1.6778, email: 'rennes@rennes.fr', phone: '02 23 62 10 10' },
    { id: 22, nom: 'Comm2-MDM', departement: '29', population: 48000, passage: '2024-04-22', statut: 'pas_demande', maire: 'François Cuillandre', revenue: '24,110 €', lat: 48.3904, lng: -4.4861, email: 'brest@brest.fr', phone: '02 98 00 80 80' },
    { id: 23, nom: 'Comm3-MDM', departement: '22', population: 19000, passage: '2024-05-23', statut: 'informe', maire: 'Hervé Guihard', revenue: '22,990 €', lat: 48.5134, lng: -2.7602, email: 'contact@saint-brieuc.fr', phone: '02 96 62 54 00' },
    { id: 24, nom: 'Comm4-MDM', departement: '56', population: 31000, passage: '2024-06-24', statut: 'fait', maire: 'David Robo', revenue: '24,560 €', lat: 47.6583, lng: -2.7609, email: 'mairie@vannes.fr', phone: '02 97 01 60 00' },
    { id: 25, nom: 'Comm5-MDM', departement: '50', population: 17000, passage: '2024-07-25', statut: 'refuse', maire: 'Benoît Arrivé', revenue: '23,870 €', lat: 49.6337, lng: -1.6222, email: 'cherbourg@cherbourg.fr', phone: '02 33 08 26 00' },
  ],
};

export const departmentMap: DepartmentMap = { '06': 'Alpes-Maritimes', '11': 'Aude', '13': 'Bouches-du-Rhône', '17': 'Charente-Maritime', '22': "Côtes-d'Armor", '29': 'Finistère', '30': 'Gard', '31': 'Haute-Garonne', '33': 'Gironde', '34': 'Hérault', '35': 'Ille-et-Vilaine', '44': 'Loire-Atlantique', '50': 'Manche', '56': 'Morbihan', '59': 'Nord', '66': "Pyrénées-Orientales", '67': 'Bas-Rhin', '69': 'Rhône', '73': 'Savoie', '74': 'Haute-Savoie', '75': 'Paris', '76': 'Seine-Maritime', '77': 'Seine-et-Marne', '78': 'Yvelines', '79': 'Deux-Sèvres', '83': 'Var', '84': 'Vaucluse', '91': 'Essonne', '92': 'Hauts-de-Seine', '93': 'Seine-Saint-Denis', '94': 'Val-de-Marne', '95': "Val-d'Oise" };

export const statusMap: StatusMap = { 
  'pas_demande': { text: 'Pas demandé', color: 'text-slate-600', bg: 'bg-slate-100' }, 
  'informe': { text: 'Informé', color: 'text-amber-600', bg: 'bg-amber-100' }, 
  'refuse': { text: 'Refusé', color: 'text-red-600', bg: 'bg-red-100' }, 
  'telescope': { text: 'Téléscopé', color: 'text-purple-600', bg: 'bg-purple-100' },
  'fait': { text: 'Faites', color: 'text-emerald-600', bg: 'bg-emerald-100' } 
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
          meteo: "Moy. 12°C, 5 jours de pluie. Conditions difficiles.",
          presse: "Foire de Strasbourg (pic de contacts / 67). Banlieues calmes.",
          mairie: "Campagne 'Strasbourg Respire' (WWF). Public réceptif."
        },
        planification_future: {
          meteo_prevue: "Moy. 5°C, risque de neige. Prévoir grand froid.",
          reputation: "Région généreuse mais très sollicitée. Climat continental.",
          retours_equipes: "Centre-ville excellent, Colmar très positif."
        }
      }
    },
  ]
};

export const eventData = [
  { name: "Foire de Strasbourg", location: "Strasbourg", lat: 48.5734, lng: 7.7521 },
  { name: "Marché de Noël de Colmar", location: "Colmar", lat: 48.0794, lng: 7.3585 },
  { name: "Fête des Lumières", location: "Lyon", lat: 45.7640, lng: 4.8357 },
  { name: "Braderie de Lille", location: "Lille", lat: 50.6292, lng: 3.0573 },
  { name: "Festival d'Avignon", location: "Avignon", lat: 43.9493, lng: 4.8055 },
];

export const dataLibraryData = {
  categories: [
    { nom: "Géographie & Territoires", items: ["Région / Département", "Urbain / Rural", "Densité", "Revenu médian", "CSP dominant", "Distance communes", "Taux de revisite", "Donateurs / 1k hab"] },
    { nom: "Temporalité", items: ["Jour / Semaine", "Créneau horaire", "Événements locaux", "Vacances scolaires", "Historique"] },
    { nom: "Météo", items: ["Température", "Pluie (mm)", "Vent", "Ensoleillement", "Corrélation"] },
    { nom: "Équipes & Fundraisers", items: ["Ancienneté", "Km à pied / jour", "Temps terrain", "Humeur / fatigue", "Score individuel"] },
    { nom: "Interactions terrain", items: ["Portes frappées", "Conversations > 1m", "Temps discussion", "Types de refus", "Signatures finales"] },
    { nom: "KPI de campagne", items: ["Taux conversion", "Don moyen (€)", "Churn 1/3/6m", "Coût / signature", "Prog. vs Objectif"] },
    { nom: "Logistique & Matériel", items: ["Véhicule / km", "Tablettes (état)", "Badges / tenues", "Logement / distance"] },
    { nom: "Population & Socio-démo", items: ["Âge médian", "Diplômes", "Proprio / locataires", "Potentiel de don"] },
    { nom: "Reporting client", items: ["Donateurs / région", "Heatmap", "Coût / donateur", "Impact estimé"] },
    { nom: "Analyses croisées & IA", items: ["Meilleure ville", "Météo ↔ conv.", "Binôme vs solo", "Heures optimales"] }
  ]
};
