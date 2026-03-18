#!/usr/bin/env node
/**
 * WesserPlan - Seed Supabase Database
 *
 * Usage: npm run seed
 *
 * Prérequis: les tables doivent exister (exécuter setup.sql dans SQL Editor d'abord)
 * Ce script insère les données logements + voitures via le client Supabase.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bcefdhuazozmiklokfte.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_bv_MAM-qXi5QNmpkF8VHIg_1l7aIi5b';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =================== HOUSINGS DATA ===================
const housings = [
  // S01
  { week:'S01', zone:'Nom du polygone', name:'"Au Diable Bleu" Appartement 3 Chambres Centre ville', lead:'Marwan Zeghoudi', region:'Franche Comté', org:'Unicef', people:5, nights:7, date_start:'2025-12-29', date_end:'2026-01-05', cost_reservation:660, cost_additional:0, has_insurance:false, cost_total:660, receipt_ok:true, channel:'Booking', dept_score:2, status:'Honorée', refund_amount:0, cost_final:660, address:'5 Boulevard des Diables Bleus, Grenoble, 38000' },
  { week:'S01', zone:'Nom du polygone', name:'Le Clos de la tour', lead:'Samy Zeghoudi', region:'Franche Comté', org:'Unicef', people:10, nights:6, date_start:'2025-12-29', date_end:'2026-01-04', cost_reservation:1400, cost_additional:0, has_insurance:false, cost_total:1400, receipt_ok:true, channel:'Appart City', dept_score:2, status:'Honorée', refund_amount:0, cost_final:1400, address:'21 boulevard Gambetta, La Tour-du-Pin, 38110' },
  { week:'S01', zone:'Nom du polygone', name:'Logement Stanislas', lead:'Stanislas Rouillon', region:'Franche Comté', org:'Unicef', people:5, nights:9, date_start:'2025-12-29', date_end:'2026-01-07', cost_reservation:750, cost_additional:0, has_insurance:true, cost_total:750, receipt_ok:true, channel:'Répertoire interne', status:'Honorée', refund_amount:0, cost_final:750 },
  { week:'S01', zone:'Nom du polygone', name:'Logement Dimitri', lead:'Dimitri Da Silva', region:'Franche Comté', org:'Unicef', people:5, nights:0, cost_reservation:700, cost_additional:0, has_insurance:true, cost_total:700, receipt_ok:true, channel:'Booking', status:'Annulée', refund_amount:630, cost_final:70 },
  { week:'S01', zone:'Nom du polygone', name:'Logement François', lead:'François Jobert', region:'PACA', org:'MDM', people:5, nights:0, cost_reservation:650, cost_additional:0, has_insurance:false, cost_total:650, receipt_ok:true, channel:'Booking', status:'Honorée', refund_amount:0, cost_final:650 },
  { week:'S01', zone:'Nom du polygone', name:"Logement Enora", lead:"Enora d'Herbais", region:'PACA', org:'MDM', people:5, nights:0, cost_reservation:690, cost_additional:0, has_insurance:false, cost_total:690, receipt_ok:true, channel:'Répertoire interne', status:'Honorée', refund_amount:0, cost_final:690 },
  { week:'S01', zone:'Nom du polygone', name:'Logement Ismaïl', lead:'Ismaïl Mabrouki', region:'PACA', org:'MDM', people:5, nights:0, cost_reservation:820, cost_additional:0, has_insurance:false, cost_total:820, receipt_ok:true, channel:'Répertoire interne', status:'Honorée', refund_amount:0, cost_final:820 },
  { week:'S01', zone:'Nom du polygone', name:'Logement Mickaël', lead:'Mickaël Picard', region:'PACA', org:'MDM', people:5, nights:0, cost_reservation:700, cost_additional:0, has_insurance:true, cost_total:700, receipt_ok:true, channel:'Répertoire interne', status:'Honorée', refund_amount:0, cost_final:700 },
  { week:'S01', zone:'Nom du polygone', name:'Logement Yanis', lead:'Yanis Zantoute', region:'Aquitaine', org:'MSF', people:5, nights:0, cost_reservation:750, cost_additional:0, has_insurance:false, cost_total:750, receipt_ok:true, channel:'Booking', status:'Honorée', refund_amount:0, cost_final:750 },
  { week:'S01', zone:'Nom du polygone', name:'Logement Wassim', lead:'Wassim Boumalouk', region:'Aquitaine', org:'MSF', people:5, nights:0, cost_reservation:660, cost_additional:0, has_insurance:false, cost_total:660, receipt_ok:true, channel:'Répertoire interne', status:'Honorée', refund_amount:0, cost_final:660 },
  { week:'S01', zone:'Nom du polygone', name:'Logement Georges', lead:'Georges', region:'Aquitaine', org:'MSF', people:5, nights:0, cost_reservation:720, cost_additional:0, has_insurance:true, cost_total:720, receipt_ok:true, channel:'Booking', status:'Honorée', refund_amount:0, cost_final:720 },
  // S02
  { week:'S02', zone:'Doubs 8k S2 E Antoine', name:'Gite au calme', lead:'Antoine Loust', region:'Franche Comté', org:'Unicef', people:5, nights:14, date_start:'2026-01-04', date_end:'2026-01-18', cost_reservation:1263.36, cost_additional:0, has_insurance:false, cost_total:1263.36, receipt_ok:true, channel:'Booking', status:'Honorée', refund_amount:0, cost_final:1263.36 },
  { week:'S02', zone:'Doubs 9k S2 A Thomas J', name:'Le belvédère des deux lacs', lead:'Thomas Jesupret', region:'Franche Comté', org:'Unicef', people:5, nights:7, date_start:'2026-01-04', date_end:'2026-01-11', cost_reservation:838.07, cost_additional:0, has_insurance:false, cost_total:838.07, receipt_ok:true, channel:'Booking', status:'Honorée', refund_amount:0, cost_final:838.07, address:'21 Rue Principale, Brey-et-Maison-du-Bois, 25240' },
  { week:'S02', zone:'Doubs 8k S2 D Mélissa', name:"Gîte le Cham'Oye", lead:'Melissa Henry', region:'Franche Comté', org:'Unicef', people:5, nights:7, date_start:'2026-01-04', date_end:'2026-01-11', cost_reservation:697.59, cost_additional:0, has_insurance:false, cost_total:697.59, receipt_ok:true, channel:'Booking', status:'Honorée', refund_amount:0, cost_final:697.59, address:'20 Rue des Écoles, Oye-et-Pallet, 25160' },
  { week:'S02', zone:'Alpes Maritime S2 Aboubacar', name:'La petite maison', lead:'Aboubacar Niakate', region:'PACA', org:'MDM', people:5, nights:14, date_start:'2026-01-04', date_end:'2026-01-18', cost_reservation:1618.60, cost_additional:0, has_insurance:false, cost_total:1618.60, receipt_ok:true, channel:'Booking', dept_score:4, status:'Honorée', refund_amount:0, cost_final:1618.60, address:'1201 Vieux Chemin de Cagnes à La Gaude, La Gaude, 06610' },
  { week:'S02', zone:'Alpes Maritime S2 Dimitri', name:'Magnifique T3, spacieux, lumineux et traversant', lead:'Dimitri Da Silva', region:'PACA', org:'MDM', people:5, nights:7, date_start:'2026-01-04', date_end:'2026-01-11', cost_reservation:590.68, cost_additional:0, has_insurance:false, cost_total:590.68, receipt_ok:true, channel:'Booking', dept_score:4, status:'Honorée', refund_amount:0, cost_final:590.68, address:'154 Boulevard de Cessole, Nice, 06100' },
  { week:'S02', zone:'Gironde 7,5k S2 Jerem', name:"Appart'City Classic Bordeaux Aéroport St Jean D'Illac", lead:'Jérémie Ethève', region:'Aquitaine', org:'MSF', people:5, nights:7, date_start:'2026-01-04', date_end:'2026-01-11', cost_reservation:745.20, cost_additional:0, has_insurance:false, cost_total:745.20, receipt_ok:true, channel:'Booking', dept_score:4, status:'Honorée', refund_amount:0, cost_final:745.20, address:'1140 Avenue De Bordeaux, Saint-Jean-dʼIllac, 33127' },
  { week:'S02', zone:'Gironde 8kh S2 Valentin G', name:'Bright apartment for 6 in Pessac', lead:'Valentin Grobey', region:'Aquitaine', org:'MSF', people:5, nights:14, date_start:'2026-01-04', date_end:'2026-01-18', cost_reservation:1403.46, cost_additional:0, has_insurance:false, cost_total:1403.46, receipt_ok:true, channel:'Booking', dept_score:4, status:'Honorée', refund_amount:0, cost_final:1403.46, address:'8 Rue Léo Ferré, Pessac, 33600' },
];

// =================== CARS DATA ===================
const cars = [
  { plate:'HF-420-SH', location:'Aquitaine', km:7856, owner:'Valentin Grobey', lat:44.8378, lng:-0.5792 },
  { plate:'HF-421-DN', location:'Aquitaine', km:13547, owner:'Jérémie Etheve', lat:44.8378, lng:-0.5792 },
  { plate:'HD-099-HQ', location:'Aquitaine', km:17804, owner:'Melvin Streicher', lat:44.8378, lng:-0.5792 },
  { plate:'HF-998-VX', location:'Aquitaine', km:5988, owner:'Théo Bastard', lat:44.8378, lng:-0.5792 },
  { plate:'HG-357-JD', location:'Aquitaine', km:3198, owner:'Théo Bastard', lat:44.8378, lng:-0.5792 },
  { plate:'HF-310-SH', location:'Aquitaine', km:14833, owner:'Antoine Loust', lat:44.8378, lng:-0.5792 },
  { plate:'HG-016-PP', location:'Aquitaine', km:11908, owner:'Thomas Jesupret', lat:44.8378, lng:-0.5792 },
  { plate:'HG-066-QR', location:'Aquitaine', km:10278, owner:'Melvin Streicher', lat:44.8378, lng:-0.5792 },
  { plate:'HF-919-TT', location:'Aquitaine', km:8132, owner:'Thayan Israël', lat:44.8378, lng:-0.5792 },
  { plate:'HD-514-JX', location:'Aquitaine', km:14127, owner:'Raphaël Larzillière', lat:44.8378, lng:-0.5792 },
  { plate:'HF-880-FZ', location:'Franche Comté', km:11710, owner:'Laura Le Bon', lat:47.2378, lng:6.0241 },
  { plate:'HG-073-CL', location:'Franche Comté', km:12420, owner:'Louanne Fontaine', lat:47.2378, lng:6.0241 },
  { plate:'HF-206-FY', location:'Franche Comté', km:12597, owner:'Marouane El Massoudi', lat:47.2378, lng:6.0241 },
  { plate:'HE-328-WP', location:'Franche Comté', km:18536, owner:'Marwan Zeghoudi', lat:47.2378, lng:6.0241 },
  { plate:'HF-746-FL', location:'Franche Comté', km:17697, owner:'Mélissa Henry', lat:47.2378, lng:6.0241 },
  { plate:'HF-328-SH', location:'PACA', km:11551, owner:'Sarah Fuentes', lat:43.7102, lng:7.2620 },
  { plate:'HE-500-SY', location:'PACA', km:10910, owner:'Alexandre Robert', lat:43.7102, lng:7.2620 },
  { plate:'HG-104-NT', location:'PACA', km:8264, owner:'Melvin Streicher', lat:43.7102, lng:7.2620 },
  { plate:'HG-445-WS', location:'PACA', km:6814, owner:'Andy Hadri', lat:43.7102, lng:7.2620 },
  { plate:'HF-389-DN', location:'PACA', km:2026, owner:'Sarah Fuentes', lat:43.7102, lng:7.2620 },
  { plate:'HJ-286-AZ', location:'PACA', km:89, owner:'Mickaël Picard', lat:43.7102, lng:7.2620 },
  { plate:'HF-882-TT', location:'Alsace', km:10801, owner:'Marouane El Masoudi', lat:48.5734, lng:7.7521 },
  { plate:'HF-649-SK', location:'Alsace', km:15664, owner:'Yamila Dembar', lat:48.5734, lng:7.7521 },
  { plate:'HD-729-VA', location:'Alsace', km:2443, owner:'Chloé Tanchoux', lat:48.5734, lng:7.7521 },
  { plate:'HH-131-QY', location:'Alsace', km:3531, owner:'Chloé Tanchoux', lat:48.5734, lng:7.7521 },
  { plate:'HF-310-DN', location:'Alsace', km:12439, owner:'Grégoire Faure', lat:48.5734, lng:7.7521 },
  { plate:'HG-216-RK', location:'Aquitaine', km:0, owner:'Antoine Loust', lat:44.8378, lng:-0.5792 },
];

async function seed() {
  console.log('🚀 WesserPlan - Seeding Supabase...\n');

  // Check connection
  const { error: testErr } = await supabase.from('housings').select('id', { count: 'exact', head: true });
  if (testErr) {
    console.error('❌ Impossible de se connecter à Supabase ou les tables n\'existent pas.');
    console.error('   Erreur:', testErr.message);
    console.error('\n📋 Exécute d\'abord supabase/setup.sql dans le SQL Editor de Supabase.');
    process.exit(1);
  }

  // Clear existing data
  console.log('🗑️  Nettoyage des données existantes...');
  await supabase.from('housings').delete().neq('id', 0);
  await supabase.from('cars').delete().neq('id', 0);

  // Insert housings in batches
  console.log(`🏠 Insertion de ${housings.length} logements...`);
  const { error: hErr } = await supabase.from('housings').insert(housings);
  if (hErr) {
    console.error('❌ Erreur logements:', hErr.message);
  } else {
    console.log(`   ✅ ${housings.length} logements insérés`);
  }

  // Insert cars
  console.log(`🚗 Insertion de ${cars.length} véhicules...`);
  const { error: cErr } = await supabase.from('cars').insert(cars);
  if (cErr) {
    console.error('❌ Erreur véhicules:', cErr.message);
  } else {
    console.log(`   ✅ ${cars.length} véhicules insérés`);
  }

  // Verify
  const { count: hCount } = await supabase.from('housings').select('*', { count: 'exact', head: true });
  const { count: cCount } = await supabase.from('cars').select('*', { count: 'exact', head: true });
  console.log(`\n📊 Résultat: ${hCount} logements, ${cCount} véhicules en base`);
  console.log('✅ Seed terminé ! Rafraîchis ton app.');
}

seed().catch(console.error);
