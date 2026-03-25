export const regionalContextData = {
  regions: [
    {
      code: "44",
      nom: "Grand Est",
      donnees: {
        analyse_passee: {
          donateurs_signes: 420,
          periode: "S.40\u201342 (Octobre)",
          meteo: "Moy. 12\u00b0C, 5 jours de pluie. Conditions difficiles en Alsace, meilleures dans le sud de la r\u00e9gion.",
          presse: "Foire europ\u00e9enne de Strasbourg (pic de contacts d\u00e9p. 67). March\u00e9 de No\u00ebl de Colmar (affluence touristique \u00e9lev\u00e9e en novembre-d\u00e9cembre).",
          mairie: "Campagne 'Strasbourg Ville Verte' (WWF). Forte sensibilit\u00e9 environnementale de la population. Public r\u00e9ceptif aux causes humanitaires."
        },
        planification_future: {
          meteo_prevue: "Moy. 5\u00b0C en janvier, risque de neige en Alsace. Pr\u00e9voir \u00e9quipements grand froid. Redoux attendu mi-f\u00e9vrier.",
          reputation: "R\u00e9gion historiquement g\u00e9n\u00e9reuse (don moyen 18\u20ac/mois) mais tr\u00e8s sollicit\u00e9e par les ONG. Climat continental marqu\u00e9. Les zones rurales du Bas-Rhin restent sous-exploit\u00e9es.",
          retours_equipes: "Centre-ville de Strasbourg excellent (taux de conversion 12%). Colmar tr\u00e8s positif en p\u00e9riode touristique. Mulhouse plus difficile, privil\u00e9gier les quartiers r\u00e9sidentiels."
        }
      }
    },
    {
      code: "75",
      nom: "\u00cele-de-France",
      donnees: {
        analyse_passee: {
          donateurs_signes: 680,
          periode: "S.36\u201339 (Septembre)",
          meteo: "Moy. 19\u00b0C, conditions id\u00e9ales pour le terrain. Bonne m\u00e9t\u00e9o = meilleurs r\u00e9sultats historiques (+15% vs moyenne).",
          presse: "Rentr\u00e9e scolaire, forte mobilisation m\u00e9diatique autour des causes enfance (UNICEF). Journ\u00e9e mondiale du c\u0153ur le 29/09.",
          mairie: "Partenariat actif avec Paris Centre pour les autorisations de prospection. Neuilly-sur-Seine r\u00e9ticent aux sollicitations de rue."
        },
        planification_future: {
          meteo_prevue: "Moy. 8\u00b0C en d\u00e9cembre, pluies fr\u00e9quentes. Pr\u00e9voir les abris et ajuster les cr\u00e9neaux horaires (privil\u00e9gier 10h-15h).",
          reputation: "Zone \u00e0 tr\u00e8s haut potentiel (don moyen 22\u20ac/mois) mais forte concurrence entre ONG. Saturation dans les arrondissements centraux de Paris.",
          retours_equipes: "Le 11e et le 15e arrondissement sont les plus rentables. La D\u00e9fense en semaine offre un bon taux de conversion sur les actifs. \u00c9viter le samedi dans les zones touristiques."
        }
      }
    },
    {
      code: "35",
      nom: "Bretagne",
      donnees: {
        analyse_passee: {
          donateurs_signes: 310,
          periode: "S.24\u201327 (Juin)",
          meteo: "Moy. 18\u00b0C, quelques averses. Conditions globalement bonnes malgr\u00e9 la variabilit\u00e9 bretonne.",
          presse: "Festival Interceltique de Lorient (affluence massive en ao\u00fbt). Fest-Noz et \u00e9v\u00e9nements culturels locaux favorables au contact.",
          mairie: "Bonne coop\u00e9ration des mairies bretonnes, notamment Rennes et Vannes. Saint-Brieuc en cours d'information."
        },
        planification_future: {
          meteo_prevue: "Moy. 10\u00b0C en mars, averses fr\u00e9quentes mais douces. \u00c9quipements imperm\u00e9ables indispensables.",
          reputation: "R\u00e9gion engag\u00e9e et solidaire (don moyen 16\u20ac/mois). Population r\u00e9ceptive aux causes environnementales (WWF) et humanitaires (MDM). Forte identit\u00e9 locale.",
          retours_equipes: "Rennes centre excellent, surtout les jours de march\u00e9 (samedi matin). Brest plus difficile hors centre-ville. Vannes sous-exploit\u00e9e avec fort potentiel touristique estival."
        }
      }
    },
  ]
};

export const eventData = [
  { name: "Foire Europ\u00e9enne de Strasbourg", location: "Strasbourg", lat: 48.5734, lng: 7.7521, date: "Septembre", type: "foire" },
  { name: "March\u00e9 de No\u00ebl de Colmar", location: "Colmar", lat: 48.0794, lng: 7.3585, date: "Nov-D\u00e9c", type: "march\u00e9" },
  { name: "F\u00eate des Lumi\u00e8res", location: "Lyon", lat: 45.7640, lng: 4.8357, date: "D\u00e9cembre", type: "festival" },
  { name: "Braderie de Lille", location: "Lille", lat: 50.6292, lng: 3.0573, date: "Septembre", type: "braderie" },
  { name: "Festival d'Avignon", location: "Avignon", lat: 43.9493, lng: 4.8055, date: "Juillet", type: "festival" },
  { name: "Festival Interceltique", location: "Lorient", lat: 47.7482, lng: -3.3702, date: "Ao\u00fbt", type: "festival" },
  { name: "F\u00eate de la Musique", location: "Paris", lat: 48.8566, lng: 2.3522, date: "Juin", type: "festival" },
  { name: "Journ\u00e9es du Patrimoine", location: "Toute la France", lat: 46.603354, lng: 1.888334, date: "Septembre", type: "national" },
];
