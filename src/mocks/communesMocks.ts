
import { Commune, Organization } from '@/types';

export const communesData: Record<Organization, Commune[]> = {
  msf: [
    {
        id: 1, nom: 'Paris 11e', departement: '75', population: 149102, passage: '2024-01-15', statut: 'fait', maire: 'Anne Hidalgo', revenue: '38 540 \u20ac', lat: 48.8566, lng: 2.3522,
        email: 'contact@mairie-paris.fr', phone: '01 42 76 40 40',
        historiquePassages: { msf: ['2024-01-15', '2023-02-10', '2022-03-05'], unicef: ['2022-05-20'], mdm: ['2021-11-11'] }
    },
    {
        id: 2, nom: 'Marseille 1er', departement: '13', population: 873076, passage: '2024-03-02', statut: 'informe', maire: 'Beno\u00eet Payan', revenue: '23 120 \u20ac', lat: 43.2965, lng: 5.3698,
        email: 'maire@marseille.fr', phone: '04 91 55 11 11',
        historiquePassages: { msf: ['2024-03-02'], wwf: ['2023-08-19', '2022-08-15'] }
    },
    {
        id: 3, nom: 'Lyon 3e', departement: '69', population: 522250, passage: '2024-05-18', statut: 'pas_demande', maire: 'Gr\u00e9gory Doucet', revenue: '27 860 \u20ac', lat: 45.7640, lng: 4.8357,
        email: 'cabinet@mairie-lyon.fr', phone: '04 72 10 30 30',
        historiquePassages: { msf: ['2022-01-10'], mdm: ['2023-04-12'] }
    },
    {
        id: 4, nom: 'Lille', departement: '59', population: 236234, passage: '2024-06-22', statut: 'refuse', maire: 'Martine Aubry', revenue: '21 550 \u20ac', lat: 50.6292, lng: 3.0573,
        email: 'contact@lille.fr', phone: '03 20 49 50 00',
        historiquePassages: { unicef: ['2023-09-01'] }
    },
    {
        id: 5, nom: 'Bordeaux', departement: '33', population: 260958, passage: '2024-09-01', statut: 'telescope', maire: 'Pierre Hurmic', revenue: '26 980 \u20ac', lat: 44.8378, lng: -0.5792,
        email: 'mairie@bordeaux.fr', phone: '05 56 10 20 30',
        historiquePassages: { wwf: ['2024-09-01'] }
    },
    { id: 6, nom: 'Strasbourg', departement: '67', population: 290576, passage: '2024-10-14', statut: 'informe', maire: 'Jeanne Barseghian', revenue: '25 430 \u20ac', lat: 48.5734, lng: 7.7521, email: 'ville@strasbourg.eu', phone: '03 68 98 50 00' },
    { id: 7, nom: 'Toulouse', departement: '31', population: 504078, passage: '2023-11-05', statut: 'fait', maire: 'Jean-Luc Moudenc', revenue: '26 110 \u20ac', lat: 43.6047, lng: 1.4442, email: 'contact@toulouse.fr', phone: '05 61 22 29 22' },
    { id: 8, nom: 'Nantes', departement: '44', population: 323204, passage: '2024-01-20', statut: 'pas_demande', maire: 'Johanna Rolland', revenue: '25 780 \u20ac', lat: 47.2184, lng: -1.5536, email: 'accueil@nantes.fr', phone: '02 40 41 90 00' },
    { id: 9, nom: 'Nice', departement: '06', population: 342669, passage: '2024-04-10', statut: 'refuse', maire: 'Christian Estrosi', revenue: '24 990 \u20ac', lat: 43.7102, lng: 7.2620, email: 'maire@nice.fr', phone: '04 97 13 20 00' },
    { id: 10, nom: 'Toulon', departement: '83', population: 180639, passage: '2024-07-30', statut: 'pas_demande', maire: 'Hubert Falco', revenue: '24 150 \u20ac', lat: 43.1242, lng: 5.9280, email: 'contact@toulon.fr', phone: '04 94 36 30 00' },
  ],
  unicef: [
    { id: 11, nom: 'Neuilly-sur-Seine', departement: '92', population: 60454, passage: '2024-02-10', statut: 'informe', maire: 'Jean-Christophe Fromantin', revenue: '45 670 \u20ac', lat: 48.8787, lng: 2.2393, email: 'neuilly@neuillysurseine.fr', phone: '01 40 88 88 88', historiquePassages: { unicef: ['2024-02-10', '2023-01-15'], msf: ['2022-04-12'] } },
    { id: 12, nom: 'Saint-Denis', departement: '93', population: 113567, passage: '2024-02-11', statut: 'telescope', maire: 'Mathieu Hanotin', revenue: '18 340 \u20ac', lat: 48.9357, lng: 2.3600, email: 'contact@saint-denis.fr', phone: '01 49 33 66 66' },
    { id: 13, nom: 'Cr\u00e9teil', departement: '94', population: 92448, passage: '2024-03-12', statut: 'fait', maire: 'Laurent Cathala', revenue: '20 890 \u20ac', lat: 48.7904, lng: 2.4494, email: 'mairie@creteil.fr', phone: '01 49 80 92 94' },
    { id: 14, nom: 'Versailles', departement: '78', population: 84808, passage: '2024-04-14', statut: 'pas_demande', maire: 'Fran\u00e7ois de Mazi\u00e8res', revenue: '42 130 \u20ac', lat: 48.8014, lng: 2.1301, email: 'versailles@versailles.fr', phone: '01 30 97 80 00' },
    { id: 15, nom: 'Cergy', departement: '95', population: 67519, passage: '2024-05-15', statut: 'refuse', maire: 'Jean-Paul Jeandon', revenue: '22 560 \u20ac', lat: 49.0384, lng: 2.0809, email: 'cergy@cergy.fr', phone: '01 34 33 44 00' },
  ],
  wwf: [
    { id: 16, nom: 'Montpellier', departement: '34', population: 299096, passage: '2024-01-05', statut: 'pas_demande', maire: 'Micha\u00ebl Delafosse', revenue: '23 450 \u20ac', lat: 43.6108, lng: 3.8767, email: 'montpellier@montpellier.fr', phone: '04 67 34 70 00', historiquePassages: { wwf: ['2024-01-05'] } },
    { id: 17, nom: 'Avignon', departement: '84', population: 93671, passage: '2024-02-06', statut: 'fait', maire: 'C\u00e9cile Helle', revenue: '20 120 \u20ac', lat: 43.9493, lng: 4.8055, email: 'contact@avignon.fr', phone: '04 90 80 80 00' },
    { id: 18, nom: 'N\u00eemes', departement: '30', population: 148236, passage: '2024-03-07', statut: 'informe', maire: 'Jean-Paul Fournier', revenue: '21 330 \u20ac', lat: 43.8367, lng: 4.3601, email: 'nimes@nimes.fr', phone: '04 66 76 70 01' },
    { id: 19, nom: 'Carcassonne', departement: '11', population: 47268, passage: '2024-04-08', statut: 'refuse', maire: 'G\u00e9rard Larrat', revenue: '20 980 \u20ac', lat: 43.2130, lng: 2.3491, email: 'contact@carcassonne.fr', phone: '04 68 77 71 11' },
    { id: 20, nom: 'Perpignan', departement: '66', population: 121875, passage: '2024-05-09', statut: 'fait', maire: 'Louis Aliot', revenue: '20 540 \u20ac', lat: 42.6887, lng: 2.8948, email: 'mairie@perpignan.fr', phone: '04 68 66 30 66' },
  ],
  mdm: [
    { id: 21, nom: 'Rennes', departement: '35', population: 225081, passage: '2024-03-21', statut: 'fait', maire: 'Nathalie App\u00e9r\u00e9', revenue: '26 760 \u20ac', lat: 48.1173, lng: -1.6778, email: 'rennes@rennes.fr', phone: '02 23 62 10 10' },
    { id: 22, nom: 'Brest', departement: '29', population: 142279, passage: '2024-04-22', statut: 'pas_demande', maire: 'Fran\u00e7ois Cuillandre', revenue: '24 110 \u20ac', lat: 48.3904, lng: -4.4861, email: 'brest@brest.fr', phone: '02 98 00 80 80' },
    { id: 23, nom: 'Saint-Brieuc', departement: '22', population: 44372, passage: '2024-05-23', statut: 'informe', maire: 'Herv\u00e9 Guihard', revenue: '22 990 \u20ac', lat: 48.5134, lng: -2.7602, email: 'contact@saint-brieuc.fr', phone: '02 96 62 54 00' },
    { id: 24, nom: 'Vannes', departement: '56', population: 55383, passage: '2024-06-24', statut: 'fait', maire: 'David Robo', revenue: '24 560 \u20ac', lat: 47.6583, lng: -2.7609, email: 'mairie@vannes.fr', phone: '02 97 01 60 00' },
    { id: 25, nom: 'Cherbourg-en-Cotentin', departement: '50', population: 79200, passage: '2024-07-25', statut: 'refuse', maire: 'Beno\u00eet Arriv\u00e9', revenue: '23 870 \u20ac', lat: 49.6337, lng: -1.6222, email: 'cherbourg@cherbourg.fr', phone: '02 33 08 26 00' },
  ],
};
