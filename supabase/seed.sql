-- ============================================
-- WesserPlan - Seed Data (Logements)
-- Données réelles issues du Google Sheet
-- ============================================

-- Vider la table avant insertion
TRUNCATE housings RESTART IDENTITY;

INSERT INTO housings (week, zone, name, lead, region, org, people, nights, date_start, date_end, cost_reservation, cost_additional, has_insurance, cost_total, receipt_ok, channel, dept_score, status, refund_amount, cost_final, address) VALUES

-- ===================== S01 (29 déc – 4 jan) =====================
('S01', 'Nom du polygone', '"Au Diable Bleu" Appartement 3 Chambres Centre ville', 'Marwan Zeghoudi', 'Franche Comté', 'Unicef', 5, 7, '2025-12-29', '2026-01-05', 660.00, 0, FALSE, 660.00, TRUE, 'Booking', 2, 'Honorée', 0, 660.00, '5 Boulevard des Diables Bleus, Grenoble, 38000'),
('S01', 'Nom du polygone', 'Le Clos de la tour', 'Samy Zeghoudi', 'Franche Comté', 'Unicef', 10, 6, '2025-12-29', '2026-01-04', 1400.00, 0, FALSE, 1400.00, TRUE, 'Appart City', 2, 'Honorée', 0, 1400.00, '21 boulevard Gambetta, La Tour-du-Pin, 38110'),
('S01', 'Nom du polygone', 'Logement Stanislas', 'Stanislas Rouillon', 'Franche Comté', 'Unicef', 5, 9, '2025-12-29', '2026-01-07', 750.00, 0, TRUE, 750.00, TRUE, 'Répertoire interne', NULL, 'Honorée', 0, 750.00, NULL),
('S01', 'Nom du polygone', 'Logement Dimitri', 'Dimitri Da Silva', 'Franche Comté', 'Unicef', 5, 0, NULL, NULL, 700.00, 0, TRUE, 700.00, TRUE, 'Booking', NULL, 'Annulée', 630.00, 70.00, NULL),
('S01', 'Nom du polygone', 'Logement François', 'François Jobert', 'PACA', 'MDM', 5, 0, NULL, NULL, 650.00, 0, FALSE, 650.00, TRUE, 'Booking', NULL, 'Honorée', 0, 650.00, NULL),
('S01', 'Nom du polygone', 'Logement Enora', 'Enora d''Herbais', 'PACA', 'MDM', 5, 0, NULL, NULL, 690.00, 0, FALSE, 690.00, TRUE, 'Répertoire interne', NULL, 'Honorée', 0, 690.00, NULL),
('S01', 'Nom du polygone', 'Logement Ismaïl', 'Ismaïl Mabrouki', 'PACA', 'MDM', 5, 0, NULL, NULL, 820.00, 0, FALSE, 820.00, TRUE, 'Répertoire interne', NULL, 'Honorée', 0, 820.00, NULL),
('S01', 'Nom du polygone', 'Logement Mickaël', 'Mickaël Picard', 'PACA', 'MDM', 5, 0, NULL, NULL, 700.00, 0, TRUE, 700.00, TRUE, 'Répertoire interne', NULL, 'Honorée', 0, 700.00, NULL),
('S01', 'Nom du polygone', 'Logement Yanis', 'Yanis Zantoute', 'Aquitaine', 'MSF', 5, 0, NULL, NULL, 750.00, 0, FALSE, 750.00, TRUE, 'Booking', NULL, 'Honorée', 0, 750.00, NULL),
('S01', 'Nom du polygone', 'Logement Wassim', 'Wassim Boumalouk', 'Aquitaine', 'MSF', 5, 0, NULL, NULL, 660.00, 0, FALSE, 660.00, TRUE, 'Répertoire interne', NULL, 'Honorée', 0, 660.00, NULL),
('S01', 'Nom du polygone', 'Logement Georges', 'Georges', 'Aquitaine', 'MSF', 5, 0, NULL, NULL, 720.00, 0, TRUE, 720.00, TRUE, 'Booking', NULL, 'Honorée', 0, 720.00, NULL),

-- ===================== S02 (5 – 11 jan) =====================
('S02', 'Doubs 8k S2 E Antoine', 'Gite au calme', 'Antoine Loust', 'Franche Comté', 'Unicef', 5, 14, '2026-01-04', '2026-01-18', 1263.36, 0, FALSE, 1263.36, TRUE, 'Booking', NULL, 'Honorée', 0, 1263.36, NULL),
('S02', 'Doubs 9k S2 A Thomas J', 'Le belvédère des deux lacs', 'Thomas Jesupret', 'Franche Comté', 'Unicef', 5, 7, '2026-01-04', '2026-01-11', 838.07, 0, FALSE, 838.07, TRUE, 'Booking', NULL, 'Honorée', 0, 838.07, '21 Rue Principale, Brey-et-Maison-du-Bois, 25240'),
('S02', 'Doubs 8k S2 D Mélissa', 'Gîte le Cham''Oye', 'Melissa Henry', 'Franche Comté', 'Unicef', 5, 7, '2026-01-04', '2026-01-11', 697.59, 0, FALSE, 697.59, TRUE, 'Booking', NULL, 'Honorée', 0, 697.59, '20 Rue des Écoles, Oye-et-Pallet, 25160'),
('S02', 'Alpes Maritime S2 Aboubacar', 'La petite maison', 'Aboubacar Niakate', 'PACA', 'MDM', 5, 14, '2026-01-04', '2026-01-18', 1618.60, 0, FALSE, 1618.60, TRUE, 'Booking', 4, 'Honorée', 0, 1618.60, '1201 Vieux Chemin de Cagnes à La Gaude, La Gaude, 06610'),
('S02', 'Alpes Maritime S2 Dimitri', 'Magnifique T3, spacieux, lumineux et traversant', 'Dimitri Da Silva', 'PACA', 'MDM', 5, 7, '2026-01-04', '2026-01-11', 590.68, 0, FALSE, 590.68, TRUE, 'Booking', 4, 'Honorée', 0, 590.68, '154 Boulevard de Cessole, Nice, 06100'),
('S02', 'Gironde 7,5k S2 Jerem', 'Appart''City Classic Bordeaux Aéroport St Jean D''Illac', 'Jérémie Ethève', 'Aquitaine', 'MSF', 5, 7, '2026-01-04', '2026-01-11', 745.20, 0, FALSE, 745.20, TRUE, 'Booking', 4, 'Honorée', 0, 745.20, '1140 Avenue De Bordeaux, Saint-Jean-dʼIllac, 33127'),
('S02', 'Gironde 8kh S2 Valentin G', 'Bright apartment for 6 in Pessac', 'Valentin Grobey', 'Aquitaine', 'MSF', 5, 14, '2026-01-04', '2026-01-18', 1403.46, 0, FALSE, 1403.46, TRUE, 'Booking', 4, 'Honorée', 0, 1403.46, '8 Rue Léo Ferré, Pessac, 33600'),

-- ===================== S03 (12 – 18 jan) =====================
('S03', 'Doubs 10k S3 E', 'Gite au calme', 'Antoine Loust', 'Franche Comté', 'Unicef', 5, 0, NULL, '2026-01-18', 0, 0, FALSE, 0, FALSE, 'Booking', NULL, 'Honorée', 0, 0, NULL),
('S03', 'Doubs 9k S3 A', 'Gîte le Cham''Oye', 'Marouane El Masoudi', 'Franche Comté', 'Unicef', 5, 7, '2026-01-11', '2026-01-18', 681.45, 144.00, FALSE, 825.45, FALSE, 'Booking', NULL, 'Honorée', 0, 825.45, '20 Rue des Écoles, 25160 Oye-et-Pallet, France'),
('S03', 'Doubs 18k S3 w1/3 D', 'Hypercentre Spacieux Authentique Haut Sauge', 'Melissa Henry', 'Franche Comté', 'Unicef', 5, 7, '2026-01-11', '2026-01-18', 595.27, 0, FALSE, 595.27, FALSE, 'Booking', NULL, 'Honorée', 0, 595.27, '40 Rue Gambetta, 25300 Pontarlier, France'),
('S03', 'Alpes Maritime S3 B', 'La petite maison', 'Aboubacar Niakate', 'PACA', 'MDM', 5, 0, NULL, '2026-01-18', 0, 0, FALSE, 0, FALSE, 'Booking', 4, 'Honorée', 0, 0, '1201 Vieux Chemin de Cagnes à La Gaude, La Gaude, 06610'),
('S03', 'Alpes Maritime S3A', 'Nidusudest 3 chambre Parking', 'Dimitri Da Silva', 'PACA', 'MDM', 5, 7, '2026-01-11', '2026-01-18', 670.47, 0, FALSE, 670.47, FALSE, 'Booking', NULL, 'Honorée', 0, 670.47, NULL),
('S03', 'Gironde k S3 W 1/3 A', 'Appart''City Classic Bordeaux Aéroport St Jean D''Illac', 'Jérémie Ethève', 'Aquitaine', 'MSF', 5, 7, '2026-01-11', '2026-01-18', 854.00, 0, FALSE, 854.00, FALSE, 'Booking', NULL, 'Honorée', 0, 854.00, '40 Rue Gambetta, 25300 Pontarlier, France'),
('S03', 'Gironde 8kh S3 B', 'La Villa d''alix', 'Valentin Grobey', 'Aquitaine', 'MSF', 5, 9, '2026-01-09', '2026-01-18', 1369.49, 0, FALSE, 1369.49, FALSE, 'Booking', NULL, 'Honorée', 0, 1369.49, NULL),
('S03', 'Gironde 25k S4 W1/3 B', 'Maison Bienlabas', 'Elie Sow', 'Aquitaine', 'MSF', 5, 7, '2026-01-11', '2026-01-18', 514.58, 0, FALSE, 514.58, FALSE, 'Booking', NULL, 'Honorée', 0, 514.58, NULL),
('S03', NULL, 'Grande maison calme proche centre terrasse jardin', 'BTC', 'Franche Comté', 'Unicef', 10, 7, '2026-01-11', '2026-01-18', 1132.98, 0, FALSE, 1132.98, FALSE, 'Compte d''un collab', NULL, 'Honorée', 0, 1132.98, NULL),

-- ===================== S04 (19 – 25 jan) =====================
('S04', 'Doubs 8k S5 A Melissa', 'Le Gite des Farfadets', 'Melissa Henry', 'Franche Comté', 'Unicef', 5, 7, '2026-01-18', '2026-01-25', 476.51, 0, FALSE, 476.51, FALSE, 'Booking', NULL, 'Honorée', 0, 476.51, '26 Rue de l''Hôpital, 25390 Flangebouche, France'),
('S04', 'Doubs 8k S6 D Marouane', 'Appart proche de la frontière', 'Marouane El Masoudi', 'Franche Comté', 'Unicef', 5, 7, '2026-01-18', '2026-01-25', 339.87, 0, FALSE, 339.87, FALSE, 'Booking', NULL, 'Honorée', 0, 339.87, '12 Les Épaisses, 25790 Les Gras, France'),
('S04', 'Doubs 9k S4 E Antoine', 'Gîte chalet, Au Doubs Logis', 'Laura Le Bon', 'Franche Comté', 'Unicef', 5, 7, '2026-01-18', '2026-01-25', 896.00, 0, FALSE, 896.00, FALSE, 'Booking', NULL, 'Honorée', 0, 896.00, '13 Rue de la Malpierre, 25510 Pierrefontaine-les-Varans, France'),
('S04', 'Alpes Maritime S3 B Aboubacar', 'Appartement Amandiers - Welkeys', 'Aboubacar Niakate', 'PACA', 'MDM', 5, 7, '2026-01-18', '2026-01-25', 700.00, 0, FALSE, 700.00, FALSE, 'Booking', 4, 'Honorée', 0, 700.00, '1 Rue Jules Ladoumegue, 06800 Cagnes-sur-Mer, France'),
('S04', 'Alpes Maritime S3 w1/2 A Dimitri', 'Nidusudest - 3 chambres - Parking', 'Dimitri Da Silva', 'PACA', 'MDM', 5, 7, '2026-01-18', '2026-01-25', 670.47, 0, FALSE, 670.47, FALSE, 'Booking', 4, 'Honorée', 0, 670.47, '33 Chemin de Sainte-Colombe, 06800 Cagnes-sur-Mer, France'),
('S04', 'Gironde 8kh S4 2/2 B', 'Appart''City Classic Bordeaux Aéroport St Jean D''Illac', 'Jérémie Ethève', 'Aquitaine', 'MSF', 5, 7, '2026-01-18', '2026-01-25', 744.30, 0, FALSE, 744.30, FALSE, 'Booking', 4, 'Honorée', 0, 744.30, '1140 Avenue De Bordeaux, 33127 Saint-Jean-dʼIllac, France'),
('S04', 'Gironde k S4 W2/3 A', 'L''Eclat de la Gironde', 'Elie Sow', 'Aquitaine', 'MSF', 5, 7, '2026-01-18', '2026-01-25', 755.36, 0, FALSE, 755.36, FALSE, 'Booking', 4, 'Honorée', 0, 755.36, '28 Avenue Mirieu de Labarre, 33140 La Hourcade, France'),
('S04', NULL, 'Grande maison calme proche centre terrasse jardin', 'BTC', 'Franche Comté', 'Unicef', 5, 7, '2026-01-18', '2026-01-25', 1100.00, 0, FALSE, 1100.00, FALSE, 'Compte d''un collab', NULL, 'Honorée', 0, 1100.00, NULL),

-- ===================== S05 (26 jan – 1 fév) =====================
('S05', NULL, 'Charmante Maison entre Cannes et Nice', 'Aboubacar Niakate', 'PACA', 'MDM', 5, 7, '2026-01-25', '2026-02-01', 683.27, 0, FALSE, 683.27, FALSE, NULL, 4, 'Honorée', 0, 683.27, '70 Chemin de la Calada, 06620 Le Bar-sur-Loup, France'),
('S05', NULL, 'Appartement T3 Cagnes sur Mer', 'Dimitri Da Silva', 'PACA', 'MDM', 5, 14, '2026-01-25', '2026-02-08', 1327.06, 0, FALSE, 1327.06, FALSE, NULL, 4, 'Honorée', 0, 1327.06, '23 Avenue Germaine, 06800 Cagnes-sur-Mer, France'),
('S05', NULL, 'L''Eclat de la Gironde', 'Elie Sow', 'Aquitaine', 'MSF', 5, 7, '2026-01-25', '2026-02-01', 763.03, 0, FALSE, 763.03, FALSE, NULL, 4, 'Honorée', 0, 763.03, '28 Avenue Mirieu de Labarre, 33140 La Hourcade, France'),
('S05', NULL, 'Magnifiques Appartements sur les Quais de Bordeaux', 'Jérémie Ethève', 'Aquitaine', 'MSF', 5, 7, '2026-01-25', '2026-02-01', 729.95, 0, FALSE, 729.95, FALSE, NULL, 4, 'Honorée', 0, 729.95, '5 Quai des Chartrons, Chartrons, 33000 Bordeaux, France'),
('S05', NULL, 'BTC S05', 'BTC', 'Franche Comté', 'Unicef', 10, 7, '2026-01-25', '2026-02-01', 700.00, 0, FALSE, 700.00, FALSE, 'Compte d''un collab', NULL, 'Honorée', 0, 700.00, NULL),
('S05', NULL, 'do mi si la do ré', 'Mélissa Henry', 'Franche Comté', 'Unicef', 5, 7, '2026-01-25', '2026-02-01', 1239.60, 0, FALSE, 1239.60, FALSE, NULL, NULL, 'Honorée', 0, 1239.60, '10 rue d Egoutte, 25400 Exincourt, France'),
('S05', NULL, 'Chalet spacieux avec jardin à La Longeville', 'Marouane El Masoudi', 'Franche Comté', 'Unicef', 5, 7, '2026-01-25', '2026-02-01', 808.80, 0, FALSE, 808.80, FALSE, NULL, NULL, 'Honorée', 0, 808.80, '5 Route de Bassignet Doubs, 25650 La Longeville, France'),

-- ===================== S06 (2 – 8 fév) =====================
('S06', NULL, '4 couchages Au Centre des Parfumeries', 'Aboubacar Niakate', 'PACA', 'MDM', 5, 7, '2026-02-01', '2026-02-08', 379.70, 0, FALSE, 379.70, FALSE, 'Booking', 5, 'Annulée', 379.70, 0, '11 Rue Jean Ossola, 06130 Grasse, France'),
('S06', NULL, 'Le Club Mougins', 'Aboubacar Niakate', 'PACA', 'MDM', 5, 5, '2026-02-03', '2026-02-08', 323.15, 74.00, FALSE, 397.15, FALSE, 'Booking', NULL, 'Honorée', 0, 397.15, 'Chemin Du Val Fleuri, Mougins, France'),
('S06', NULL, 'do mi si la do ré', 'Laura Le Bon', 'Franche Comté', 'Unicef', 5, 7, '2026-02-01', '2026-02-08', 1260.26, 0, FALSE, 1260.26, FALSE, 'Booking', NULL, 'Honorée', 0, 1260.26, '10 rue d Egoutte, 25400 Exincourt, France'),
('S06', NULL, 'BTC S06', 'BTC', 'Franche Comté', 'Unicef', 10, 7, '2026-02-01', '2026-02-08', 1200.00, 0, FALSE, 1200.00, FALSE, 'Compte d''un collab', NULL, 'Honorée', 0, 1200.00, NULL),
('S06', NULL, 'Clos Chantegrive', 'Elie Sow', 'Aquitaine', 'MSF', 5, 7, '2026-02-01', '2026-02-08', 1667.40, 0, FALSE, 1667.40, FALSE, 'Booking', 4, 'Honorée', 0, 1667.40, '6 Rue Francis Poulenc, 33160 Saint-Médard-en-Jalles, France'),
('S06', NULL, 'Appart Familial, prox Gare & Centre-ville, garage', 'Wassim Boumallouk', 'Franche Comté', 'Unicef', 5, 7, '2026-02-01', '2026-02-08', 615.86, 0, FALSE, 615.86, FALSE, 'Booking', NULL, 'Honorée', 0, 615.86, '6a Rue Résal, 25000 Besançon, France'),
('S06', NULL, 'EVASION LOUE #4 "Le DOMAINE"', 'Marouane El Masoudi', 'Franche Comté', 'Unicef', 5, 7, '2026-02-01', '2026-02-08', 502.64, 0, FALSE, 502.64, FALSE, 'Booking', NULL, 'Annulée', 75.40, 427.24, 'le Schiste, 25930 Lods, France'),
('S06', NULL, 'Sous le Château', 'Marouane El Masoudi', 'Franche Comté', 'Unicef', 5, 7, '2026-02-01', '2026-02-08', 617.40, 0, FALSE, 617.40, FALSE, NULL, NULL, 'Honorée', 0, 617.40, '28 Rue du Château, 25290 Ornans, France'),

-- ===================== S07 (8 – 15 fév) =====================
('S07', 'Doubs 16k S7 w2/2 D', 'Appartements Climatisés Centre-ville / 10 personnes', 'Wassim Boumallouk', 'Franche Comté', 'Unicef', 10, 7, '2026-02-08', '2026-02-15', 845.34, 0, FALSE, 845.34, FALSE, NULL, NULL, 'Honorée', 0, 845.34, '1 Rue du Balcon, Besançon, France 25000'),
('S07', 'Doubs 7,5k S7 A', 'Une bulle de quiétude au cœur du Doubs', 'Marouane El Masoudi', 'Franche Comté', 'Unicef', 5, 7, '2026-02-08', '2026-02-15', 582.39, 0, FALSE, 582.39, FALSE, 'Booking', NULL, 'Honorée', 0, 582.39, '29 Avenue Jean Jaurès Audincourt, France 25400'),
('S07', 'Doubs 7,5k S7 E', 'gîte Les Coquelicots', 'Laura Le Bon', 'Franche Comté', 'Unicef', 5, 7, '2026-02-08', '2026-02-15', 605.85, 0, FALSE, 605.85, FALSE, 'Booking', NULL, 'Honorée', 0, 605.85, '11 Rue du Crepenot, Médière, France, 25250'),
('S07', 'Gironde k S7 W2/3 C', 'Lavie Maison Nouveau Chartrons', 'Elie Sow', 'Aquitaine', 'MSF', 5, 7, '2026-02-08', '2026-02-15', 823.02, 0, FALSE, 823.02, TRUE, 'Booking', 4, 'Honorée', 0, 823.02, 'Rue Minvielle 61, Bordeaux, France, 33000'),
('S07', 'Gironde 10k S7 A', 'La Maison des Poneys', 'Maeva Coronado', 'Aquitaine', 'MSF', 5, 7, '2026-02-08', '2026-02-15', 713.19, 0, FALSE, 713.19, TRUE, 'Booking', 4, 'Honorée', 0, 713.19, '1251 Rte de Soulac, Le Pian-Médoc, France, 33290'),
('S07', 'Alpes Maritime S8 w1/2 A', 'Le Club Mougins', 'Mickaël Picard', 'PACA', 'MDM', 5, 7, '2026-02-08', '2026-02-15', 640.84, 0, FALSE, 640.84, TRUE, 'Booking', NULL, 'Honorée', 0, 640.84, 'Chemin Du Val Fleuri, Mougins, France'),
('S07', 'Alpes Maritime S6 w3/3 B', 'Maisonnette with swimming pool', 'Dimitri Da Silva', 'PACA', 'MDM', 5, 14, '2026-02-08', '2026-02-22', 1633.08, 0, FALSE, 1633.08, TRUE, 'Booking', 5, 'Honorée', 0, 1633.08, '55 Chemin des Vallières, Cagnes-sur-Mer, France, 06800'),
('S07', 'Alpes Maritime S8 w1/3 C', 'Grand appartement hyper centre Grasse', 'Thomas Jesupret', 'PACA', 'MDM', 5, 14, '2026-02-08', '2026-02-22', 1514.98, 0, FALSE, 1514.98, TRUE, 'Booking', 5, 'Honorée', 0, 1514.98, '10 Rue de la Poissonnerie, Grasse, France, 06130'),

-- ===================== S08 (16 – 22 fév) =====================
('S08', 'Doubs 14k S6 w2/2 B', 'Gîte des Fées', 'BTC', 'Franche Comté', 'Unicef', 10, 7, '2026-02-15', '2026-02-22', 1155.00, 0, FALSE, 1155.00, TRUE, 'Booking', NULL, 'Honorée', 0, 1155.00, '2 rue de Chassignoles, Pretin, 39110, France'),
('S08', 'Doubs 16k S8 w1/2', 'Une bulle de quiétude au cœur du Doubs', 'Marouane El Masoudi', 'Franche Comté', 'Unicef', 5, 14, '2026-02-15', '2026-03-01', 1232.71, 0, FALSE, 1232.71, TRUE, 'Booking', NULL, 'Honorée', 0, 1232.71, '29 Avenue Jean Jaurès Audincourt, France 25400'),
('S08', 'Doubs 8k S8 E', 'Appartement spacieux à Échenans de 80 m² avec parking inclus', 'Laura Le Bon', 'Franche Comté', 'Unicef', 5, 7, '2026-02-15', '2026-02-22', 744.00, 0, FALSE, 744.00, FALSE, 'Booking', NULL, 'Honorée', 0, 744.00, '7 Grande Rue, Échenans, France 25550'),
('S08', 'Doubs 8,5k S8', 'Le coquet chez Maguy Maison de ville avec jardin', 'Wassim Boumallouk', 'Franche Comté', 'Unicef', 10, 7, '2026-02-15', '2026-02-22', 580.10, 0, FALSE, 580.10, FALSE, 'Booking', NULL, 'Honorée', 0, 580.10, '16 Rue Xavier Marmier, BESANCON, France, 25000'),
('S08', 'Gironde 45k S8 W 1/3 B', 'Belle VILLA sur PESSAC, 6 chambres avec piscine, hammam et sauna', 'Jérémie Ethève', 'Aquitaine', 'MSF', 10, 7, '2026-02-15', '2026-02-22', 1492.31, 0, FALSE, 1492.31, FALSE, 'Booking', 4, 'Honorée', 0, 1492.31, '11 Avenue de la Forge, Pessac, France, 33600'),
('S08', NULL, 'Charming apartment with 2 balconies', 'Mickaël Picard', 'PACA', 'MDM', 5, 7, '2026-02-15', '2026-02-22', 677.34, 150.00, FALSE, 827.34, FALSE, 'Booking', NULL, 'Honorée', 0, 827.34, '620 1ère Avenue, Plaine de la Brague, 06600'),

-- ===================== S09 (22 fév – 1 mars) =====================
('S09', 'Alpes Maritime S9 B Dimitri', 'Appartements French Riviera Confidential Centre Ville Juan les Pins', 'Dimitri Da Silva', 'PACA', 'MDM', 10, 7, '2026-02-22', '2026-03-01', 1202.50, 0, FALSE, 1202.50, FALSE, 'Booking', 5, 'Honorée', 0, 1202.50, 'Best Western Astoria 15 Avenue du Maréchal Joffre Juan les Pins, France 06160'),
('S09', 'Alpes Maritime S9 w3/3 C (10)', '7 couchages aux portes des célèbres Parfumeries WIFI', 'Mickaël Picard', 'PACA', 'MDM', 5, 6, '2026-02-23', '2026-03-01', 451.39, 0, FALSE, 451.39, FALSE, 'Booking', 5, 'Honorée', 0, 451.39, '13 Rue Mougins Roquefort Grasse, France 06130'),
('S09', 'Gironde 15k S8 W1/2 A', 'La Maison des Poneys', 'Maeva Coronado', 'Aquitaine', 'MSF', 5, 7, '2026-02-23', '2026-03-01', 713.19, 0, FALSE, 713.19, FALSE, 'Booking', 4, 'Honorée', 0, 713.19, '1251 Rte de Soulac, Le Pian-Médoc, France, 33290'),
('S09', NULL, 'Le Chai de Mario', 'Jérémie Ethève', 'Aquitaine', 'MSF', 7, 7, '2026-02-23', '2026-03-02', 1036.50, 112.70, FALSE, 1149.20, FALSE, 'Booking', 4, 'Honorée', 0, 1149.20, '14 Le Ruzat Sadirac, France 33670'),
('S09', NULL, 'loft médoc 8p', 'BTC', 'Aquitaine', 'MSF', 8, 0, NULL, NULL, 1108.74, 0, FALSE, 1108.74, FALSE, NULL, NULL, 'Honorée', 0, 1108.74, NULL),
('S09', 'Doubs 8k S9 E Anast', '202 - Chaleureux appartement proche centre ville', 'Anastasie Guisard', 'Franche Comté', 'Unicef', 5, 7, '2026-02-23', '2026-03-01', 497.71, 0, FALSE, 497.71, FALSE, 'Booking', 2, 'Honorée', 0, 497.71, '11 Rue de Valenciennes Belfort, France 90000'),

-- ===================== S10 (1 – 8 mars) =====================
('S10', NULL, 'maison calme et spacieuse', 'Antoine Loust BTC', 'Aquitaine', 'MSF', 10, 7, '2026-03-01', '2026-03-08', 1709.56, 0, FALSE, 1709.56, FALSE, 'Booking', 4, 'Honorée', 0, 1709.56, 'RDC 34 ter avenue Victor Hugo, BASSENS, France, 33530'),
('S10', NULL, 'Maison Le Mascaret', 'Raphael Larzilière', 'Aquitaine', 'MSF', 5, 7, '2026-03-01', '2026-03-08', 715.36, 0, FALSE, 715.36, FALSE, 'Booking', 4, 'Honorée', 0, 715.36, '1 Ter Rue des Flots, Vayres, France, 33870'),
('S10', NULL, 'Grande maison neuve idéale pour 6 personnes', 'Thayan Israel', 'Aquitaine', 'MSF', 5, 7, '2026-03-01', '2026-03-08', 759.03, 0, FALSE, 759.03, FALSE, 'Booking', 4, 'Honorée', 0, 759.03, '16 TER Chemin de Jean Pan, Saint-Loubès, France, 33450'),
('S10', NULL, 'The Hidden Gem Of Bordeaux', 'Maeva C', 'Aquitaine', 'MSF', 5, 7, '2026-03-01', '2026-03-08', 849.66, 0, FALSE, 849.66, FALSE, NULL, 4, 'Honorée', 0, 849.66, '28 Rue du Kiosque, Lormont, 33310'),
('S10', NULL, 'Maison de Vacances à louer Alpes Maritimes', 'Andy Hadri', 'PACA', 'MDM', 5, 7, '2026-03-01', '2026-03-08', 595.00, 91.00, FALSE, 686.00, FALSE, 'Booking', 4, 'Honorée', 0, 686.00, '1000 Chemin des Plaines, Mouans-Sartoux, France, 06370'),
('S10', NULL, 'Appartement avec terrasse 6 personnes PAS DE FETE', 'Chloé Tanchoux', 'Franche Comté', 'Unicef', 5, 7, '2026-03-01', '2026-03-08', 697.87, 0, FALSE, 697.87, FALSE, NULL, 2, 'Honorée', 0, 697.87, '84 route de Dambenois 90400 Trévenans'),
('S10', NULL, '101 - Appartement élégant art déco près du centre ville', 'Marouane BTC', 'Franche Comté', 'Unicef', 5, 7, '2026-03-01', '2026-03-08', 497.71, 0, FALSE, 497.71, FALSE, NULL, 2, 'Honorée', 0, 497.71, '1er étage 11 Rue de Valenciennes, Belfort, France, 90000'),
('S10', NULL, '202 - Chaleureux appartement proche centre ville', 'Georges BTC', 'Franche Comté', 'Unicef', 5, 7, '2026-03-01', '2026-03-08', 497.71, 0, FALSE, 497.71, FALSE, NULL, 2, 'Honorée', 0, 497.71, '11 rue de Valenciennes, Belfort, France, 90000'),
('S10', NULL, 'Appart''Hôtel Le Jaurès - Jardin privé et Netflix', 'Anastasie Guisard', 'Franche Comté', 'Unicef', 5, 7, '2026-03-01', '2026-03-08', 590.69, 0, FALSE, 590.69, FALSE, 'Booking', 2, 'Honorée', 0, 590.69, '133 Avenue Jean Jaurès, Belfort, France, 90000'),
('S10', NULL, 'mily appart 6', 'Grégoire Faure', 'Alsace', 'Unicef', 5, 7, '2026-03-01', '2026-03-08', 780.21, 0, FALSE, 780.21, FALSE, 'Booking', 2, 'Honorée', 0, 780.21, '81 rue jean jaures, Rixheim, 68170, France'),
('S10', NULL, 'Le Sun Valley - Vidéoprojecteur et Terrasse Zen', 'Dimitri Da Silva', 'PACA', 'MDM', 8, 7, '2026-03-01', '2026-03-08', 973.02, 0, FALSE, 973.02, FALSE, 'Booking', 4, 'Honorée', 0, 973.02, '19 Avenue Prince de Galles, Prado - République, 06400 Cannes, France'),

-- ===================== S11 (8 – 15 mars) =====================
('S11', 'S11 A Elie', 'Maison de Vacances', 'Elie Sow', 'Aquitaine', 'MSF', 8, 7, '2026-03-08', '2026-03-15', 1380.60, 0, FALSE, 1380.60, FALSE, 'Booking', 4, 'Honorée', 0, 1380.60, '9 Chemin du Nord, 33370 Yvrac, France'),
('S11', 'Gironde 8kh S11 F Mathys', 'Maison Le Mascaret', 'Mathys F', 'Aquitaine', 'MSF', 5, 7, '2026-03-08', '2026-03-15', 715.36, 0, FALSE, 715.36, FALSE, 'Booking', 4, 'Honorée', 0, 715.36, '1 Ter Rue des Flots, Vayres, France, 33870'),
('S11', 'S9 7,5k F grégoire', 'Gîte de la Lisière du Bois', 'Grégoire F', 'Alsace', 'Unicef', 5, 7, '2026-03-08', '2026-03-15', 876.00, 0, FALSE, 876.00, FALSE, NULL, NULL, 'Honorée', 0, 876.00, 'Rue de la Carrière Ueberstrass, France 68580'),
('S11', 'D S8 Yamila', 'Maison Tivoli', 'Yamila', 'Alsace', 'Unicef', 5, 7, '2026-03-08', '2026-03-15', 574.48, 0, FALSE, 574.48, FALSE, NULL, 2, 'Honorée', 0, 574.48, 'Deuxième étage 14 Avenue de Bâle Huningue, France 68330'),
('S11', 'Doubs 8k S11 E', 'Le Repaire du Lion - Quadruplex - 10 voyageurs', 'BTC', 'Franche Comté', 'Unicef', 10, 7, '2026-03-08', '2026-03-15', 1223.72, 0, FALSE, 1223.72, FALSE, NULL, 2, 'Honorée', 0, 1223.72, '44 Faubourg de France Belfort, France 90000'),
('S11', 'Alpes Maritime S11 A (13) Dimitri', 'Appartement Elena par Interhome', 'Dimitri Da Silva', 'PACA', 'MDM', 4, 7, '2026-03-08', '2026-03-15', 552.90, 0, FALSE, 552.90, FALSE, NULL, 4, 'Honorée', 0, 552.90, 'La Roquette sur Siagne, France 06550'),
('S11', 'Alpes Maritime S11 C (12) Andy', 'Maison cosy avec piscine à Mouans-Sartoux', 'Andy Hadri', 'PACA', 'MDM', 5, 7, '2026-03-08', '2026-03-15', 736.06, 0, FALSE, 736.06, FALSE, NULL, 4, 'Honorée', 0, 736.06, 'maison 505 Chemin des Canebiers Mouans-Sartoux, France 06370'),

-- ===================== S12 (15 – 22 mars) =====================
('S12', 'Alpes Maritime S10 A Andy et S12 A Mickael', 'Idéal Groupes & Familles 3 chambres - 10 pers - Hyper-centre Cannes', 'Andy H et Michael P', 'PACA', 'MDM', 10, 7, '2026-03-15', '2026-03-22', 1353.13, 0, FALSE, 1353.13, FALSE, NULL, 4, 'Honorée', 0, 1353.13, 'Jean Jaures, 11 ans Banane, France 06400'),
('S12', 'Gironde 8kh S13 D Mathys', 'Fabuleuse maison 2 chambres avec piscine entre Bordeaux et saint Emilion', 'Mathys F', 'Aquitaine', 'MSF', 5, 7, '2026-03-15', '2026-03-22', 704.06, 0, FALSE, 704.06, FALSE, NULL, 4, 'Honorée', 0, 704.06, '1 Lotissement le Grand Pierre Sadirac, France 33670'),
('S12', 'S13 G Antoine et S15 Elie', 'Château La Fontaine', 'Antoine L et Elie S', 'Aquitaine', 'MSF', 10, 7, '2026-03-15', '2026-03-22', 1450.76, 0, FALSE, 1450.76, FALSE, NULL, 4, 'Honorée', 0, 1450.76, '12 la placette Fronsac, France 33126'),
('S12', 'S10 7,5k F Grégoire', 'Gîte Guldangel', 'Grégoire F', 'Alsace', 'Unicef', 5, 7, '2026-03-15', '2026-03-22', 725.59, 0, FALSE, 725.59, FALSE, NULL, 2, 'Honorée', 0, 725.59, '19 rue du Général de Gaulle Hirsingue, France 68560'),
('S12', 'S12 8k D Yamila', 'Le Duplex by Leslodgespa - Loft moderne et confortable', 'Yamila', 'Alsace', 'Unicef', 5, 7, '2026-03-15', '2026-03-22', 554.02, 0, FALSE, 554.02, FALSE, NULL, 2, 'Honorée', 0, 554.02, '18 rue de Buschwiller Hésingue, France 68220'),
('S12', 'S12 F w1/2 Anastasie', 'Gîtes d''Illfurth', 'Anastasie G', 'Alsace', 'Unicef', 5, 7, '2026-03-15', '2026-03-22', 717.00, 0, FALSE, 717.00, FALSE, NULL, 2, 'Honorée', 0, 717.00, '23A Rue Saint-Brice Illfurth, France 68720'),
('S12', NULL, 'Studio RM', 'Melvin Streicher', 'Aquitaine', 'MSF', 1, 7, '2026-03-15', '2026-03-22', 300.56, 0, FALSE, 300.56, FALSE, NULL, 4, 'Honorée', 0, 300.56, '6 Chemin de Ruby Saint-Loubès, France 33450');
