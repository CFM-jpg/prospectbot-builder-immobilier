// pages/api/scraper/immobilier.js
// API Marché Immobilier — DVF live + Base de référence 2024/2025
// Sources: DVF Notaires / INSEE / LPI SeLoger / FNAIM / Meilleurs Agents

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ============================================================
// BASE DE RÉFÉRENCE MARCHÉ — 96 départements + ~50 villes
// Sources : DVF Notaires + LPI SeLoger + FNAIM — T3/T4 2024
// ============================================================

const MARCHE_PAR_DEPARTEMENT = {
  "01": { nom: "Ain",                      prixM2Appart: 2650, prixM2Maison: 2480, loyer: 10.2, tension: "moyen", delaiVente: 72, tauxNego: 4.5, rentaBrute: 5.8 },
  "02": { nom: "Aisne",                    prixM2Appart: 1380, prixM2Maison: 1250, loyer: 7.8,  tension: "faible",delaiVente: 95, tauxNego: 6.5, rentaBrute: 7.2 },
  "03": { nom: "Allier",                   prixM2Appart: 1180, prixM2Maison: 1050, loyer: 7.2,  tension: "faible",delaiVente:110, tauxNego: 7.0, rentaBrute: 7.8 },
  "04": { nom: "Alpes-de-Haute-Provence",  prixM2Appart: 2200, prixM2Maison: 2480, loyer: 9.8,  tension: "faible",delaiVente: 98, tauxNego: 5.5, rentaBrute: 5.9 },
  "05": { nom: "Hautes-Alpes",             prixM2Appart: 2850, prixM2Maison: 2950, loyer: 10.5, tension: "moyen", delaiVente: 85, tauxNego: 4.8, rentaBrute: 5.2 },
  "06": { nom: "Alpes-Maritimes",          prixM2Appart: 5200, prixM2Maison: 6800, loyer: 16.5, tension: "fort",  delaiVente: 58, tauxNego: 3.5, rentaBrute: 4.0 },
  "07": { nom: "Ardèche",                  prixM2Appart: 1850, prixM2Maison: 1980, loyer: 8.5,  tension: "faible",delaiVente: 92, tauxNego: 5.5, rentaBrute: 6.2 },
  "08": { nom: "Ardennes",                 prixM2Appart: 1050, prixM2Maison: 980,  loyer: 7.0,  tension: "faible",delaiVente:115, tauxNego: 7.5, rentaBrute: 8.5 },
  "09": { nom: "Ariège",                   prixM2Appart: 1450, prixM2Maison: 1620, loyer: 7.8,  tension: "faible",delaiVente:105, tauxNego: 6.0, rentaBrute: 7.0 },
  "10": { nom: "Aube",                     prixM2Appart: 1580, prixM2Maison: 1480, loyer: 8.2,  tension: "faible",delaiVente: 95, tauxNego: 6.0, rentaBrute: 7.0 },
  "11": { nom: "Aude",                     prixM2Appart: 1950, prixM2Maison: 2100, loyer: 9.0,  tension: "faible",delaiVente: 88, tauxNego: 5.5, rentaBrute: 6.2 },
  "12": { nom: "Aveyron",                  prixM2Appart: 1680, prixM2Maison: 1580, loyer: 8.2,  tension: "faible",delaiVente:100, tauxNego: 5.8, rentaBrute: 6.8 },
  "13": { nom: "Bouches-du-Rhône",         prixM2Appart: 3650, prixM2Maison: 4200, loyer: 13.5, tension: "fort",  delaiVente: 62, tauxNego: 4.0, rentaBrute: 5.0 },
  "14": { nom: "Calvados",                 prixM2Appart: 2850, prixM2Maison: 2650, loyer: 10.8, tension: "moyen", delaiVente: 75, tauxNego: 4.8, rentaBrute: 5.5 },
  "15": { nom: "Cantal",                   prixM2Appart: 1100, prixM2Maison: 1050, loyer: 7.0,  tension: "faible",delaiVente:120, tauxNego: 7.0, rentaBrute: 8.2 },
  "16": { nom: "Charente",                 prixM2Appart: 1580, prixM2Maison: 1680, loyer: 8.2,  tension: "faible",delaiVente: 95, tauxNego: 6.0, rentaBrute: 6.9 },
  "17": { nom: "Charente-Maritime",        prixM2Appart: 3200, prixM2Maison: 3800, loyer: 11.5, tension: "moyen", delaiVente: 72, tauxNego: 4.5, rentaBrute: 4.8 },
  "18": { nom: "Cher",                     prixM2Appart: 1280, prixM2Maison: 1180, loyer: 7.5,  tension: "faible",delaiVente:110, tauxNego: 6.8, rentaBrute: 7.8 },
  "19": { nom: "Corrèze",                  prixM2Appart: 1380, prixM2Maison: 1280, loyer: 7.8,  tension: "faible",delaiVente:108, tauxNego: 6.5, rentaBrute: 7.5 },
  "21": { nom: "Côte-d'Or",               prixM2Appart: 2650, prixM2Maison: 2450, loyer: 10.5, tension: "moyen", delaiVente: 72, tauxNego: 4.8, rentaBrute: 5.8 },
  "22": { nom: "Côtes-d'Armor",           prixM2Appart: 2050, prixM2Maison: 2180, loyer: 9.2,  tension: "faible",delaiVente: 88, tauxNego: 5.2, rentaBrute: 6.0 },
  "23": { nom: "Creuse",                   prixM2Appart: 780,  prixM2Maison: 720,  loyer: 6.0,  tension: "faible",delaiVente:145, tauxNego: 9.0, rentaBrute: 9.8 },
  "24": { nom: "Dordogne",                 prixM2Appart: 1680, prixM2Maison: 1850, loyer: 8.5,  tension: "faible",delaiVente: 98, tauxNego: 5.8, rentaBrute: 6.5 },
  "25": { nom: "Doubs",                    prixM2Appart: 2350, prixM2Maison: 2150, loyer: 9.8,  tension: "moyen", delaiVente: 78, tauxNego: 5.0, rentaBrute: 6.0 },
  "26": { nom: "Drôme",                    prixM2Appart: 2480, prixM2Maison: 2680, loyer: 10.2, tension: "moyen", delaiVente: 75, tauxNego: 4.8, rentaBrute: 5.8 },
  "27": { nom: "Eure",                     prixM2Appart: 1980, prixM2Maison: 2050, loyer: 9.0,  tension: "faible",delaiVente: 88, tauxNego: 5.5, rentaBrute: 6.2 },
  "28": { nom: "Eure-et-Loir",             prixM2Appart: 2050, prixM2Maison: 2150, loyer: 9.2,  tension: "faible",delaiVente: 85, tauxNego: 5.2, rentaBrute: 6.0 },
  "29": { nom: "Finistère",                prixM2Appart: 2380, prixM2Maison: 2550, loyer: 9.8,  tension: "moyen", delaiVente: 78, tauxNego: 4.8, rentaBrute: 5.8 },
  "30": { nom: "Gard",                     prixM2Appart: 2480, prixM2Maison: 2650, loyer: 10.2, tension: "moyen", delaiVente: 78, tauxNego: 5.0, rentaBrute: 5.8 },
  "31": { nom: "Haute-Garonne",            prixM2Appart: 3480, prixM2Maison: 3650, loyer: 13.2, tension: "fort",  delaiVente: 52, tauxNego: 3.2, rentaBrute: 5.2 },
  "32": { nom: "Gers",                     prixM2Appart: 1580, prixM2Maison: 1750, loyer: 8.2,  tension: "faible",delaiVente:105, tauxNego: 6.0, rentaBrute: 7.0 },
  "33": { nom: "Gironde",                  prixM2Appart: 4100, prixM2Maison: 4650, loyer: 14.5, tension: "fort",  delaiVente: 55, tauxNego: 3.5, rentaBrute: 4.5 },
  "34": { nom: "Hérault",                  prixM2Appart: 3200, prixM2Maison: 3650, loyer: 12.5, tension: "fort",  delaiVente: 60, tauxNego: 3.8, rentaBrute: 5.0 },
  "35": { nom: "Ille-et-Vilaine",          prixM2Appart: 3450, prixM2Maison: 3200, loyer: 12.5, tension: "fort",  delaiVente: 55, tauxNego: 3.5, rentaBrute: 5.0 },
  "36": { nom: "Indre",                    prixM2Appart: 1050, prixM2Maison: 980,  loyer: 7.0,  tension: "faible",delaiVente:120, tauxNego: 7.5, rentaBrute: 8.5 },
  "37": { nom: "Indre-et-Loire",           prixM2Appart: 2650, prixM2Maison: 2850, loyer: 10.5, tension: "moyen", delaiVente: 72, tauxNego: 4.5, rentaBrute: 5.5 },
  "38": { nom: "Isère",                    prixM2Appart: 2950, prixM2Maison: 2780, loyer: 11.5, tension: "fort",  delaiVente: 62, tauxNego: 4.0, rentaBrute: 5.5 },
  "39": { nom: "Jura",                     prixM2Appart: 1680, prixM2Maison: 1580, loyer: 8.5,  tension: "faible",delaiVente: 98, tauxNego: 5.8, rentaBrute: 6.8 },
  "40": { nom: "Landes",                   prixM2Appart: 3050, prixM2Maison: 3850, loyer: 11.5, tension: "moyen", delaiVente: 68, tauxNego: 4.5, rentaBrute: 5.0 },
  "41": { nom: "Loir-et-Cher",             prixM2Appart: 1750, prixM2Maison: 1850, loyer: 8.8,  tension: "faible",delaiVente: 95, tauxNego: 5.8, rentaBrute: 6.5 },
  "42": { nom: "Loire",                    prixM2Appart: 1950, prixM2Maison: 1780, loyer: 9.0,  tension: "moyen", delaiVente: 78, tauxNego: 5.2, rentaBrute: 6.2 },
  "43": { nom: "Haute-Loire",              prixM2Appart: 1380, prixM2Maison: 1280, loyer: 7.8,  tension: "faible",delaiVente:105, tauxNego: 6.5, rentaBrute: 7.5 },
  "44": { nom: "Loire-Atlantique",         prixM2Appart: 3850, prixM2Maison: 3650, loyer: 13.5, tension: "fort",  delaiVente: 52, tauxNego: 3.2, rentaBrute: 5.0 },
  "45": { nom: "Loiret",                   prixM2Appart: 2150, prixM2Maison: 2050, loyer: 9.5,  tension: "moyen", delaiVente: 78, tauxNego: 5.0, rentaBrute: 5.9 },
  "46": { nom: "Lot",                      prixM2Appart: 1580, prixM2Maison: 1780, loyer: 8.2,  tension: "faible",delaiVente:102, tauxNego: 6.0, rentaBrute: 7.0 },
  "47": { nom: "Lot-et-Garonne",           prixM2Appart: 1680, prixM2Maison: 1780, loyer: 8.5,  tension: "faible",delaiVente: 98, tauxNego: 5.8, rentaBrute: 6.8 },
  "48": { nom: "Lozère",                   prixM2Appart: 1380, prixM2Maison: 1480, loyer: 7.8,  tension: "faible",delaiVente:112, tauxNego: 6.5, rentaBrute: 7.2 },
  "49": { nom: "Maine-et-Loire",           prixM2Appart: 2650, prixM2Maison: 2450, loyer: 10.5, tension: "moyen", delaiVente: 72, tauxNego: 4.8, rentaBrute: 5.8 },
  "50": { nom: "Manche",                   prixM2Appart: 1950, prixM2Maison: 2150, loyer: 9.0,  tension: "faible",delaiVente: 88, tauxNego: 5.5, rentaBrute: 6.2 },
  "51": { nom: "Marne",                    prixM2Appart: 2150, prixM2Maison: 2050, loyer: 9.5,  tension: "moyen", delaiVente: 80, tauxNego: 5.2, rentaBrute: 6.0 },
  "52": { nom: "Haute-Marne",              prixM2Appart: 980,  prixM2Maison: 920,  loyer: 6.8,  tension: "faible",delaiVente:125, tauxNego: 7.8, rentaBrute: 9.0 },
  "53": { nom: "Mayenne",                  prixM2Appart: 1850, prixM2Maison: 1750, loyer: 8.8,  tension: "faible",delaiVente: 90, tauxNego: 5.5, rentaBrute: 6.5 },
  "54": { nom: "Meurthe-et-Moselle",       prixM2Appart: 2050, prixM2Maison: 1850, loyer: 9.2,  tension: "moyen", delaiVente: 80, tauxNego: 5.2, rentaBrute: 6.2 },
  "55": { nom: "Meuse",                    prixM2Appart: 1050, prixM2Maison: 980,  loyer: 7.0,  tension: "faible",delaiVente:118, tauxNego: 7.2, rentaBrute: 8.5 },
  "56": { nom: "Morbihan",                 prixM2Appart: 3050, prixM2Maison: 3350, loyer: 11.5, tension: "moyen", delaiVente: 68, tauxNego: 4.5, rentaBrute: 5.2 },
  "57": { nom: "Moselle",                  prixM2Appart: 1850, prixM2Maison: 1680, loyer: 8.8,  tension: "faible",delaiVente: 88, tauxNego: 5.5, rentaBrute: 6.5 },
  "58": { nom: "Nièvre",                   prixM2Appart: 980,  prixM2Maison: 880,  loyer: 6.8,  tension: "faible",delaiVente:130, tauxNego: 8.0, rentaBrute: 9.2 },
  "59": { nom: "Nord",                     prixM2Appart: 2380, prixM2Maison: 2050, loyer: 10.0, tension: "moyen", delaiVente: 75, tauxNego: 5.0, rentaBrute: 6.0 },
  "60": { nom: "Oise",                     prixM2Appart: 2280, prixM2Maison: 2480, loyer: 9.8,  tension: "moyen", delaiVente: 78, tauxNego: 5.0, rentaBrute: 5.9 },
  "61": { nom: "Orne",                     prixM2Appart: 1480, prixM2Maison: 1380, loyer: 8.0,  tension: "faible",delaiVente:102, tauxNego: 6.2, rentaBrute: 7.2 },
  "62": { nom: "Pas-de-Calais",            prixM2Appart: 1880, prixM2Maison: 1680, loyer: 8.8,  tension: "faible",delaiVente: 88, tauxNego: 5.8, rentaBrute: 6.5 },
  "63": { nom: "Puy-de-Dôme",             prixM2Appart: 2250, prixM2Maison: 2050, loyer: 9.5,  tension: "moyen", delaiVente: 78, tauxNego: 5.0, rentaBrute: 5.9 },
  "64": { nom: "Pyrénées-Atlantiques",     prixM2Appart: 3450, prixM2Maison: 4200, loyer: 12.5, tension: "fort",  delaiVente: 58, tauxNego: 3.8, rentaBrute: 4.8 },
  "65": { nom: "Hautes-Pyrénées",          prixM2Appart: 1680, prixM2Maison: 1880, loyer: 8.5,  tension: "faible",delaiVente: 95, tauxNego: 5.8, rentaBrute: 6.8 },
  "66": { nom: "Pyrénées-Orientales",      prixM2Appart: 2650, prixM2Maison: 3050, loyer: 10.8, tension: "moyen", delaiVente: 72, tauxNego: 4.8, rentaBrute: 5.5 },
  "67": { nom: "Bas-Rhin",                 prixM2Appart: 3050, prixM2Maison: 2850, loyer: 11.5, tension: "fort",  delaiVente: 60, tauxNego: 3.8, rentaBrute: 5.2 },
  "68": { nom: "Haut-Rhin",               prixM2Appart: 2650, prixM2Maison: 2480, loyer: 10.5, tension: "moyen", delaiVente: 72, tauxNego: 4.5, rentaBrute: 5.5 },
  "69": { nom: "Rhône",                    prixM2Appart: 4800, prixM2Maison: 4950, loyer: 15.5, tension: "fort",  delaiVente: 48, tauxNego: 2.8, rentaBrute: 4.5 },
  "70": { nom: "Haute-Saône",              prixM2Appart: 1280, prixM2Maison: 1180, loyer: 7.5,  tension: "faible",delaiVente:112, tauxNego: 6.8, rentaBrute: 7.8 },
  "71": { nom: "Saône-et-Loire",           prixM2Appart: 1650, prixM2Maison: 1480, loyer: 8.5,  tension: "faible",delaiVente: 95, tauxNego: 5.8, rentaBrute: 7.0 },
  "72": { nom: "Sarthe",                   prixM2Appart: 1950, prixM2Maison: 1850, loyer: 9.0,  tension: "faible",delaiVente: 88, tauxNego: 5.5, rentaBrute: 6.2 },
  "73": { nom: "Savoie",                   prixM2Appart: 4200, prixM2Maison: 4650, loyer: 14.5, tension: "fort",  delaiVente: 55, tauxNego: 3.5, rentaBrute: 4.5 },
  "74": { nom: "Haute-Savoie",             prixM2Appart: 5100, prixM2Maison: 5800, loyer: 16.0, tension: "fort",  delaiVente: 50, tauxNego: 3.0, rentaBrute: 4.2 },
  "75": { nom: "Paris",                    prixM2Appart: 9650, prixM2Maison:11200, loyer: 28.5, tension: "fort",  delaiVente: 42, tauxNego: 2.5, rentaBrute: 3.5 },
  "76": { nom: "Seine-Maritime",           prixM2Appart: 2450, prixM2Maison: 2280, loyer: 10.0, tension: "moyen", delaiVente: 78, tauxNego: 5.0, rentaBrute: 5.8 },
  "77": { nom: "Seine-et-Marne",           prixM2Appart: 3050, prixM2Maison: 3250, loyer: 11.5, tension: "fort",  delaiVente: 62, tauxNego: 4.0, rentaBrute: 5.0 },
  "78": { nom: "Yvelines",                 prixM2Appart: 4200, prixM2Maison: 5100, loyer: 14.5, tension: "fort",  delaiVente: 55, tauxNego: 3.2, rentaBrute: 4.2 },
  "79": { nom: "Deux-Sèvres",              prixM2Appart: 1580, prixM2Maison: 1680, loyer: 8.2,  tension: "faible",delaiVente: 98, tauxNego: 6.0, rentaBrute: 7.0 },
  "80": { nom: "Somme",                    prixM2Appart: 1980, prixM2Maison: 1850, loyer: 9.0,  tension: "faible",delaiVente: 88, tauxNego: 5.5, rentaBrute: 6.2 },
  "81": { nom: "Tarn",                     prixM2Appart: 2050, prixM2Maison: 2250, loyer: 9.2,  tension: "moyen", delaiVente: 80, tauxNego: 5.2, rentaBrute: 6.0 },
  "82": { nom: "Tarn-et-Garonne",          prixM2Appart: 1980, prixM2Maison: 2180, loyer: 9.0,  tension: "faible",delaiVente: 88, tauxNego: 5.5, rentaBrute: 6.2 },
  "83": { nom: "Var",                      prixM2Appart: 4350, prixM2Maison: 5200, loyer: 15.0, tension: "fort",  delaiVente: 55, tauxNego: 3.5, rentaBrute: 4.2 },
  "84": { nom: "Vaucluse",                 prixM2Appart: 2650, prixM2Maison: 3050, loyer: 10.8, tension: "moyen", delaiVente: 72, tauxNego: 4.8, rentaBrute: 5.5 },
  "85": { nom: "Vendée",                   prixM2Appart: 2850, prixM2Maison: 3350, loyer: 11.0, tension: "moyen", delaiVente: 68, tauxNego: 4.5, rentaBrute: 5.2 },
  "86": { nom: "Vienne",                   prixM2Appart: 1980, prixM2Maison: 1880, loyer: 9.0,  tension: "faible",delaiVente: 88, tauxNego: 5.5, rentaBrute: 6.2 },
  "87": { nom: "Haute-Vienne",             prixM2Appart: 1680, prixM2Maison: 1580, loyer: 8.5,  tension: "faible",delaiVente: 95, tauxNego: 5.8, rentaBrute: 6.8 },
  "88": { nom: "Vosges",                   prixM2Appart: 1280, prixM2Maison: 1180, loyer: 7.5,  tension: "faible",delaiVente:110, tauxNego: 6.8, rentaBrute: 7.8 },
  "89": { nom: "Yonne",                    prixM2Appart: 1580, prixM2Maison: 1480, loyer: 8.2,  tension: "faible",delaiVente: 98, tauxNego: 6.0, rentaBrute: 7.0 },
  "90": { nom: "Territoire de Belfort",    prixM2Appart: 1880, prixM2Maison: 1750, loyer: 8.8,  tension: "faible",delaiVente: 90, tauxNego: 5.5, rentaBrute: 6.5 },
  "91": { nom: "Essonne",                  prixM2Appart: 3450, prixM2Maison: 3850, loyer: 13.0, tension: "fort",  delaiVente: 58, tauxNego: 3.5, rentaBrute: 4.8 },
  "92": { nom: "Hauts-de-Seine",           prixM2Appart: 7200, prixM2Maison: 8500, loyer: 22.0, tension: "fort",  delaiVente: 45, tauxNego: 2.8, rentaBrute: 3.8 },
  "93": { nom: "Seine-Saint-Denis",        prixM2Appart: 3850, prixM2Maison: 3950, loyer: 14.0, tension: "fort",  delaiVente: 58, tauxNego: 4.0, rentaBrute: 4.8 },
  "94": { nom: "Val-de-Marne",             prixM2Appart: 5100, prixM2Maison: 5650, loyer: 17.0, tension: "fort",  delaiVente: 50, tauxNego: 3.0, rentaBrute: 4.2 },
  "95": { nom: "Val-d'Oise",              prixM2Appart: 3050, prixM2Maison: 3250, loyer: 11.5, tension: "fort",  delaiVente: 62, tauxNego: 4.0, rentaBrute: 5.0 },
};

const MARCHE_PAR_VILLE = {
  // IDF
  paris:              { nom:"Paris",              dep:"75", pop:2145000, prixM2Appart:9650, prixM2Maison:11200, prixMedian:9400,  loyer:28.5, tension:"fort",   delaiVente:42, tauxNego:2.5, volumeAnnuel:29000, rentaBrute:3.5, rentaNette:2.8, evolution1an:-2.8, evolution3ans:4.2,  evolution5ans:18.5, budgetMedian:520000, apportMoyen:22, surfaceMoyenne:52, piecesMoyennes:2.8 },
  boulogneBillancourt:{ nom:"Boulogne-Billancourt",dep:"92", pop:121000,  prixM2Appart:7850, prixM2Maison:9200,  prixMedian:7600,  loyer:24.0, tension:"fort",   delaiVente:48, tauxNego:3.0, volumeAnnuel:4200,  rentaBrute:3.8, rentaNette:3.0, evolution1an:-3.5, evolution3ans:2.8,  evolution5ans:15.2, budgetMedian:480000, apportMoyen:24, surfaceMoyenne:58, piecesMoyennes:3.0 },
  versailles:         { nom:"Versailles",          dep:"78", pop:86000,   prixM2Appart:5800, prixM2Maison:6200,  prixMedian:5600,  loyer:18.5, tension:"fort",   delaiVente:52, tauxNego:3.2, volumeAnnuel:2800,  rentaBrute:4.0, rentaNette:3.2, evolution1an:-2.2, evolution3ans:5.5,  evolution5ans:20.0, budgetMedian:380000, apportMoyen:23, surfaceMoyenne:65, piecesMoyennes:3.5 },
  // LYON
  lyon:               { nom:"Lyon",                dep:"69", pop:522000,  prixM2Appart:4950, prixM2Maison:5100,  prixMedian:4750,  loyer:15.8, tension:"fort",   delaiVente:48, tauxNego:2.8, volumeAnnuel:15200, rentaBrute:4.5, rentaNette:3.6, evolution1an:-4.2, evolution3ans:8.5,  evolution5ans:32.0, budgetMedian:280000, apportMoyen:18, surfaceMoyenne:55, piecesMoyennes:2.8 },
  villeurbanne:       { nom:"Villeurbanne",         dep:"69", pop:149000,  prixM2Appart:3850, prixM2Maison:3950,  prixMedian:3700,  loyer:13.5, tension:"fort",   delaiVente:52, tauxNego:3.2, volumeAnnuel:5200,  rentaBrute:5.0, rentaNette:4.0, evolution1an:-3.8, evolution3ans:10.2, evolution5ans:35.0, budgetMedian:220000, apportMoyen:16, surfaceMoyenne:55, piecesMoyennes:2.8 },
  venissieux:         { nom:"Vénissieux",           dep:"69", pop:65000,   prixM2Appart:2450, prixM2Maison:2650,  prixMedian:2350,  loyer:10.5, tension:"moyen",  delaiVente:68, tauxNego:4.5, volumeAnnuel:1800,  rentaBrute:6.0, rentaNette:4.8, evolution1an:-2.5, evolution3ans:8.0,  evolution5ans:28.0, budgetMedian:145000, apportMoyen:14, surfaceMoyenne:58, piecesMoyennes:3.0 },
  // TOULOUSE
  toulouse:           { nom:"Toulouse",             dep:"31", pop:493000,  prixM2Appart:3500, prixM2Maison:3750,  prixMedian:3350,  loyer:13.5, tension:"fort",   delaiVente:50, tauxNego:3.0, volumeAnnuel:13800, rentaBrute:5.2, rentaNette:4.2, evolution1an:-1.8, evolution3ans:15.5, evolution5ans:38.0, budgetMedian:210000, apportMoyen:15, surfaceMoyenne:58, piecesMoyennes:2.9 },
  blagnac:            { nom:"Blagnac",               dep:"31", pop:24000,   prixM2Appart:3200, prixM2Maison:3550,  prixMedian:3100,  loyer:12.8, tension:"fort",   delaiVente:52, tauxNego:3.2, volumeAnnuel:1250,  rentaBrute:5.5, rentaNette:4.4, evolution1an:-1.5, evolution3ans:14.0, evolution5ans:36.0, budgetMedian:235000, apportMoyen:16, surfaceMoyenne:68, piecesMoyennes:3.2 },
  tournefeuille:      { nom:"Tournefeuille",         dep:"31", pop:28000,   prixM2Appart:3050, prixM2Maison:3350,  prixMedian:2950,  loyer:12.2, tension:"fort",   delaiVente:55, tauxNego:3.5, volumeAnnuel:980,   rentaBrute:5.6, rentaNette:4.5, evolution1an:-1.2, evolution3ans:13.5, evolution5ans:35.0, budgetMedian:255000, apportMoyen:17, surfaceMoyenne:72, piecesMoyennes:3.4 },
  colomiers:          { nom:"Colomiers",             dep:"31", pop:38000,   prixM2Appart:2950, prixM2Maison:3150,  prixMedian:2850,  loyer:11.8, tension:"moyen",  delaiVente:58, tauxNego:3.8, volumeAnnuel:1450,  rentaBrute:5.8, rentaNette:4.6, evolution1an:-1.0, evolution3ans:12.8, evolution5ans:33.0, budgetMedian:225000, apportMoyen:15, surfaceMoyenne:70, piecesMoyennes:3.3 },
  castanetTolosan:    { nom:"Castanet-Tolosan",      dep:"31", pop:14500,   prixM2Appart:2850, prixM2Maison:3050,  prixMedian:2750,  loyer:11.5, tension:"moyen",  delaiVente:62, tauxNego:4.0, volumeAnnuel:520,   rentaBrute:5.8, rentaNette:4.6, evolution1an:-0.8, evolution3ans:12.0, evolution5ans:32.0, budgetMedian:248000, apportMoyen:16, surfaceMoyenne:78, piecesMoyennes:3.5 },
  muret:              { nom:"Muret",                 dep:"31", pop:26500,   prixM2Appart:2550, prixM2Maison:2750,  prixMedian:2450,  loyer:10.8, tension:"moyen",  delaiVente:68, tauxNego:4.5, volumeAnnuel:850,   rentaBrute:6.0, rentaNette:4.8, evolution1an:-0.5, evolution3ans:11.5, evolution5ans:30.0, budgetMedian:195000, apportMoyen:14, surfaceMoyenne:75, piecesMoyennes:3.4 },
  // BORDEAUX
  bordeaux:           { nom:"Bordeaux",              dep:"33", pop:260000,  prixM2Appart:4200, prixM2Maison:4750,  prixMedian:4000,  loyer:14.5, tension:"fort",   delaiVente:55, tauxNego:3.5, volumeAnnuel:9800,  rentaBrute:4.8, rentaNette:3.8, evolution1an:-5.5, evolution3ans:5.2,  evolution5ans:28.5, budgetMedian:295000, apportMoyen:19, surfaceMoyenne:62, piecesMoyennes:3.0 },
  merignac:           { nom:"Mérignac",              dep:"33", pop:70000,   prixM2Appart:3350, prixM2Maison:3750,  prixMedian:3200,  loyer:12.5, tension:"moyen",  delaiVente:62, tauxNego:4.0, volumeAnnuel:2800,  rentaBrute:5.2, rentaNette:4.2, evolution1an:-4.2, evolution3ans:6.5,  evolution5ans:30.0, budgetMedian:245000, apportMoyen:17, surfaceMoyenne:68, piecesMoyennes:3.2 },
  pessac:             { nom:"Pessac",                dep:"33", pop:63000,   prixM2Appart:3250, prixM2Maison:3650,  prixMedian:3100,  loyer:12.2, tension:"moyen",  delaiVente:65, tauxNego:4.2, volumeAnnuel:2400,  rentaBrute:5.3, rentaNette:4.2, evolution1an:-3.8, evolution3ans:7.0,  evolution5ans:31.0, budgetMedian:235000, apportMoyen:16, surfaceMoyenne:68, piecesMoyennes:3.2 },
  // MARSEILLE
  marseille:          { nom:"Marseille",             dep:"13", pop:870000,  prixM2Appart:3250, prixM2Maison:3850,  prixMedian:3050,  loyer:12.5, tension:"moyen",  delaiVente:65, tauxNego:4.2, volumeAnnuel:14500, rentaBrute:5.2, rentaNette:4.2, evolution1an:2.5,  evolution3ans:18.0, evolution5ans:42.0, budgetMedian:195000, apportMoyen:14, surfaceMoyenne:58, piecesMoyennes:2.9 },
  aixEnProvence:      { nom:"Aix-en-Provence",       dep:"13", pop:144000,  prixM2Appart:4650, prixM2Maison:5850,  prixMedian:4450,  loyer:15.5, tension:"fort",   delaiVente:55, tauxNego:3.5, volumeAnnuel:4200,  rentaBrute:4.5, rentaNette:3.5, evolution1an:1.5,  evolution3ans:14.5, evolution5ans:36.0, budgetMedian:320000, apportMoyen:21, surfaceMoyenne:68, piecesMoyennes:3.2 },
  // NICE
  nice:               { nom:"Nice",                  dep:"06", pop:342000,  prixM2Appart:5100, prixM2Maison:6500,  prixMedian:4850,  loyer:16.5, tension:"fort",   delaiVente:58, tauxNego:3.5, volumeAnnuel:7200,  rentaBrute:4.2, rentaNette:3.3, evolution1an:0.5,  evolution3ans:10.5, evolution5ans:28.0, budgetMedian:320000, apportMoyen:22, surfaceMoyenne:58, piecesMoyennes:2.8 },
  cannes:             { nom:"Cannes",                dep:"06", pop:74000,   prixM2Appart:6200, prixM2Maison:8500,  prixMedian:5950,  loyer:19.5, tension:"fort",   delaiVente:62, tauxNego:4.0, volumeAnnuel:2100,  rentaBrute:3.9, rentaNette:3.1, evolution1an:1.0,  evolution3ans:8.5,  evolution5ans:22.0, budgetMedian:395000, apportMoyen:26, surfaceMoyenne:60, piecesMoyennes:2.8 },
  antibes:            { nom:"Antibes",               dep:"06", pop:75000,   prixM2Appart:4950, prixM2Maison:6200,  prixMedian:4700,  loyer:16.0, tension:"fort",   delaiVente:60, tauxNego:3.8, volumeAnnuel:2400,  rentaBrute:4.2, rentaNette:3.3, evolution1an:0.8,  evolution3ans:9.0,  evolution5ans:24.0, budgetMedian:335000, apportMoyen:23, surfaceMoyenne:62, piecesMoyennes:2.9 },
  // MONTPELLIER
  montpellier:        { nom:"Montpellier",           dep:"34", pop:296000,  prixM2Appart:3350, prixM2Maison:3850,  prixMedian:3200,  loyer:12.8, tension:"fort",   delaiVente:58, tauxNego:3.8, volumeAnnuel:8200,  rentaBrute:5.0, rentaNette:4.0, evolution1an:-1.2, evolution3ans:12.5, evolution5ans:35.0, budgetMedian:215000, apportMoyen:15, surfaceMoyenne:58, piecesMoyennes:2.8 },
  // NANTES
  nantes:             { nom:"Nantes",                dep:"44", pop:320000,  prixM2Appart:3900, prixM2Maison:3750,  prixMedian:3750,  loyer:14.0, tension:"fort",   delaiVente:52, tauxNego:3.2, volumeAnnuel:10200, rentaBrute:5.0, rentaNette:4.0, evolution1an:-3.8, evolution3ans:6.8,  evolution5ans:30.0, budgetMedian:255000, apportMoyen:17, surfaceMoyenne:62, piecesMoyennes:3.0 },
  saintNazaire:       { nom:"Saint-Nazaire",         dep:"44", pop:69000,   prixM2Appart:2650, prixM2Maison:2850,  prixMedian:2550,  loyer:10.8, tension:"moyen",  delaiVente:68, tauxNego:4.5, volumeAnnuel:2200,  rentaBrute:5.5, rentaNette:4.4, evolution1an:-2.5, evolution3ans:8.5,  evolution5ans:32.0, budgetMedian:188000, apportMoyen:14, surfaceMoyenne:68, piecesMoyennes:3.2 },
  // RENNES
  rennes:             { nom:"Rennes",                dep:"35", pop:222000,  prixM2Appart:3700, prixM2Maison:3450,  prixMedian:3550,  loyer:13.5, tension:"fort",   delaiVente:50, tauxNego:3.0, volumeAnnuel:7200,  rentaBrute:5.0, rentaNette:4.0, evolution1an:-2.8, evolution3ans:9.5,  evolution5ans:34.0, budgetMedian:245000, apportMoyen:16, surfaceMoyenne:60, piecesMoyennes:2.9 },
  // STRASBOURG
  strasbourg:         { nom:"Strasbourg",            dep:"67", pop:285000,  prixM2Appart:3150, prixM2Maison:2950,  prixMedian:3000,  loyer:12.0, tension:"fort",   delaiVente:58, tauxNego:3.8, volumeAnnuel:7500,  rentaBrute:5.2, rentaNette:4.2, evolution1an:-1.5, evolution3ans:10.5, evolution5ans:32.0, budgetMedian:215000, apportMoyen:15, surfaceMoyenne:60, piecesMoyennes:2.9 },
  // LILLE
  lille:              { nom:"Lille",                 dep:"59", pop:235000,  prixM2Appart:3250, prixM2Maison:2850,  prixMedian:3100,  loyer:13.0, tension:"fort",   delaiVente:55, tauxNego:3.5, volumeAnnuel:8500,  rentaBrute:5.5, rentaNette:4.4, evolution1an:-1.0, evolution3ans:12.5, evolution5ans:36.0, budgetMedian:210000, apportMoyen:14, surfaceMoyenne:58, piecesMoyennes:2.8 },
  roubaix:            { nom:"Roubaix",               dep:"59", pop:96000,   prixM2Appart:1850, prixM2Maison:1650,  prixMedian:1750,  loyer:9.5,  tension:"moyen",  delaiVente:72, tauxNego:5.5, volumeAnnuel:2200,  rentaBrute:7.0, rentaNette:5.6, evolution1an:0.5,  evolution3ans:8.0,  evolution5ans:25.0, budgetMedian:118000, apportMoyen:12, surfaceMoyenne:62, piecesMoyennes:3.2 },
  // AUTRES
  grenoble:           { nom:"Grenoble",              dep:"38", pop:158000,  prixM2Appart:2850, prixM2Maison:2950,  prixMedian:2700,  loyer:11.5, tension:"fort",   delaiVente:60, tauxNego:4.0, volumeAnnuel:5200,  rentaBrute:5.5, rentaNette:4.4, evolution1an:-2.0, evolution3ans:9.0,  evolution5ans:28.0, budgetMedian:188000, apportMoyen:14, surfaceMoyenne:60, piecesMoyennes:2.9 },
  clermontFerrand:    { nom:"Clermont-Ferrand",      dep:"63", pop:143000,  prixM2Appart:2250, prixM2Maison:2100,  prixMedian:2150,  loyer:9.8,  tension:"moyen",  delaiVente:72, tauxNego:5.0, volumeAnnuel:3800,  rentaBrute:5.9, rentaNette:4.7, evolution1an:-1.5, evolution3ans:8.0,  evolution5ans:24.0, budgetMedian:155000, apportMoyen:13, surfaceMoyenne:62, piecesMoyennes:3.0 },
  dijon:              { nom:"Dijon",                 dep:"21", pop:155000,  prixM2Appart:2700, prixM2Maison:2500,  prixMedian:2580,  loyer:10.8, tension:"moyen",  delaiVente:70, tauxNego:4.8, volumeAnnuel:4200,  rentaBrute:5.6, rentaNette:4.5, evolution1an:-1.8, evolution3ans:8.5,  evolution5ans:26.0, budgetMedian:178000, apportMoyen:14, surfaceMoyenne:62, piecesMoyennes:3.0 },
  nimes:              { nom:"Nîmes",                 dep:"30", pop:154000,  prixM2Appart:2350, prixM2Maison:2650,  prixMedian:2250,  loyer:10.2, tension:"moyen",  delaiVente:72, tauxNego:5.0, volumeAnnuel:3600,  rentaBrute:5.9, rentaNette:4.7, evolution1an:0.5,  evolution3ans:10.5, evolution5ans:28.0, budgetMedian:165000, apportMoyen:13, surfaceMoyenne:62, piecesMoyennes:3.0 },
  tours:              { nom:"Tours",                 dep:"37", pop:136000,  prixM2Appart:2750, prixM2Maison:3000,  prixMedian:2650,  loyer:11.0, tension:"moyen",  delaiVente:68, tauxNego:4.5, volumeAnnuel:4200,  rentaBrute:5.5, rentaNette:4.4, evolution1an:-1.5, evolution3ans:9.5,  evolution5ans:28.0, budgetMedian:188000, apportMoyen:14, surfaceMoyenne:62, piecesMoyennes:3.0 },
  angers:             { nom:"Angers",                dep:"49", pop:156000,  prixM2Appart:2800, prixM2Maison:2650,  prixMedian:2700,  loyer:11.2, tension:"fort",   delaiVente:65, tauxNego:4.2, volumeAnnuel:4500,  rentaBrute:5.5, rentaNette:4.4, evolution1an:-2.2, evolution3ans:9.0,  evolution5ans:30.0, budgetMedian:192000, apportMoyen:14, surfaceMoyenne:62, piecesMoyennes:3.0 },
  limoges:            { nom:"Limoges",               dep:"87", pop:130000,  prixM2Appart:1700, prixM2Maison:1600,  prixMedian:1630,  loyer:8.5,  tension:"faible", delaiVente:88, tauxNego:5.8, volumeAnnuel:3200,  rentaBrute:6.8, rentaNette:5.5, evolution1an:-0.5, evolution3ans:5.5,  evolution5ans:18.0, budgetMedian:125000, apportMoyen:12, surfaceMoyenne:65, piecesMoyennes:3.0 },
  reims:              { nom:"Reims",                 dep:"51", pop:184000,  prixM2Appart:2200, prixM2Maison:2050,  prixMedian:2100,  loyer:9.8,  tension:"moyen",  delaiVente:75, tauxNego:5.0, volumeAnnuel:4200,  rentaBrute:6.0, rentaNette:4.8, evolution1an:-1.0, evolution3ans:8.0,  evolution5ans:24.0, budgetMedian:152000, apportMoyen:13, surfaceMoyenne:62, piecesMoyennes:3.0 },
  caen:               { nom:"Caen",                  dep:"14", pop:107000,  prixM2Appart:2900, prixM2Maison:2750,  prixMedian:2800,  loyer:11.2, tension:"moyen",  delaiVente:70, tauxNego:4.8, volumeAnnuel:3200,  rentaBrute:5.5, rentaNette:4.4, evolution1an:-1.5, evolution3ans:8.5,  evolution5ans:26.0, budgetMedian:195000, apportMoyen:14, surfaceMoyenne:62, piecesMoyennes:3.0 },
  rouen:              { nom:"Rouen",                 dep:"76", pop:112000,  prixM2Appart:2550, prixM2Maison:2350,  prixMedian:2450,  loyer:10.5, tension:"moyen",  delaiVente:72, tauxNego:5.0, volumeAnnuel:3500,  rentaBrute:5.8, rentaNette:4.6, evolution1an:-1.2, evolution3ans:8.0,  evolution5ans:24.0, budgetMedian:175000, apportMoyen:13, surfaceMoyenne:62, piecesMoyennes:3.0 },
  nancy:              { nom:"Nancy",                 dep:"54", pop:103000,  prixM2Appart:2100, prixM2Maison:1950,  prixMedian:2000,  loyer:9.5,  tension:"moyen",  delaiVente:75, tauxNego:5.2, volumeAnnuel:3200,  rentaBrute:6.2, rentaNette:4.9, evolution1an:-0.8, evolution3ans:7.5,  evolution5ans:22.0, budgetMedian:145000, apportMoyen:13, surfaceMoyenne:62, piecesMoyennes:3.0 },
  metz:               { nom:"Metz",                  dep:"57", pop:117000,  prixM2Appart:2000, prixM2Maison:1850,  prixMedian:1900,  loyer:9.2,  tension:"moyen",  delaiVente:78, tauxNego:5.5, volumeAnnuel:2900,  rentaBrute:6.2, rentaNette:5.0, evolution1an:-0.5, evolution3ans:7.0,  evolution5ans:21.0, budgetMedian:138000, apportMoyen:12, surfaceMoyenne:62, piecesMoyennes:3.0 },
  orleans:            { nom:"Orléans",               dep:"45", pop:114000,  prixM2Appart:2250, prixM2Maison:2350,  prixMedian:2150,  loyer:10.0, tension:"moyen",  delaiVente:75, tauxNego:5.0, volumeAnnuel:3200,  rentaBrute:6.0, rentaNette:4.8, evolution1an:-1.0, evolution3ans:8.0,  evolution5ans:24.0, budgetMedian:158000, apportMoyen:13, surfaceMoyenne:62, piecesMoyennes:3.0 },
  pau:                { nom:"Pau",                   dep:"64", pop:77000,   prixM2Appart:2150, prixM2Maison:2350,  prixMedian:2050,  loyer:9.5,  tension:"moyen",  delaiVente:75, tauxNego:5.2, volumeAnnuel:2200,  rentaBrute:6.2, rentaNette:5.0, evolution1an:0.5,  evolution3ans:9.0,  evolution5ans:26.0, budgetMedian:155000, apportMoyen:13, surfaceMoyenne:65, piecesMoyennes:3.0 },
  perpignan:          { nom:"Perpignan",             dep:"66", pop:121000,  prixM2Appart:1950, prixM2Maison:2350,  prixMedian:1850,  loyer:9.0,  tension:"faible", delaiVente:82, tauxNego:5.8, volumeAnnuel:2800,  rentaBrute:6.5, rentaNette:5.2, evolution1an:1.5,  evolution3ans:12.0, evolution5ans:32.0, budgetMedian:145000, apportMoyen:12, surfaceMoyenne:65, piecesMoyennes:3.0 },
  brest:              { nom:"Brest",                 dep:"29", pop:143000,  prixM2Appart:2200, prixM2Maison:2400,  prixMedian:2100,  loyer:9.5,  tension:"moyen",  delaiVente:72, tauxNego:5.0, volumeAnnuel:3500,  rentaBrute:6.0, rentaNette:4.8, evolution1an:-1.5, evolution3ans:8.5,  evolution5ans:28.0, budgetMedian:152000, apportMoyen:13, surfaceMoyenne:62, piecesMoyennes:3.0 },
  leHavre:            { nom:"Le Havre",              dep:"76", pop:170000,  prixM2Appart:2100, prixM2Maison:1950,  prixMedian:2000,  loyer:9.2,  tension:"faible", delaiVente:80, tauxNego:5.8, volumeAnnuel:3800,  rentaBrute:6.2, rentaNette:5.0, evolution1an:-0.5, evolution3ans:7.5,  evolution5ans:22.0, budgetMedian:145000, apportMoyen:12, surfaceMoyenne:65, piecesMoyennes:3.0 },
  amiens:             { nom:"Amiens",                dep:"80", pop:135000,  prixM2Appart:2050, prixM2Maison:1900,  prixMedian:1950,  loyer:9.0,  tension:"faible", delaiVente:82, tauxNego:5.8, volumeAnnuel:3100,  rentaBrute:6.0, rentaNette:4.8, evolution1an:-0.8, evolution3ans:7.0,  evolution5ans:20.0, budgetMedian:142000, apportMoyen:12, surfaceMoyenne:62, piecesMoyennes:3.0 },
  mulhouse:           { nom:"Mulhouse",              dep:"68", pop:110000,  prixM2Appart:1950, prixM2Maison:1800,  prixMedian:1850,  loyer:9.0,  tension:"faible", delaiVente:82, tauxNego:6.0, volumeAnnuel:2500,  rentaBrute:6.5, rentaNette:5.2, evolution1an:-0.5, evolution3ans:6.5,  evolution5ans:20.0, budgetMedian:132000, apportMoyen:12, surfaceMoyenne:62, piecesMoyennes:3.0 },
  besancon:           { nom:"Besançon",              dep:"25", pop:117000,  prixM2Appart:2350, prixM2Maison:2150,  prixMedian:2250,  loyer:10.0, tension:"moyen",  delaiVente:75, tauxNego:5.2, volumeAnnuel:2800,  rentaBrute:5.9, rentaNette:4.7, evolution1an:-1.0, evolution3ans:7.5,  evolution5ans:22.0, budgetMedian:158000, apportMoyen:13, surfaceMoyenne:62, piecesMoyennes:3.0 },
  toulon:             { nom:"Toulon",                dep:"83", pop:176000,  prixM2Appart:3100, prixM2Maison:3800,  prixMedian:2950,  loyer:12.0, tension:"moyen",  delaiVente:68, tauxNego:4.5, volumeAnnuel:4200,  rentaBrute:5.5, rentaNette:4.4, evolution1an:1.0,  evolution3ans:12.0, evolution5ans:30.0, budgetMedian:205000, apportMoyen:15, surfaceMoyenne:65, piecesMoyennes:3.0 },
  avignon:            { nom:"Avignon",               dep:"84", pop:91000,   prixM2Appart:2650, prixM2Maison:3050,  prixMedian:2550,  loyer:10.8, tension:"moyen",  delaiVente:70, tauxNego:4.8, volumeAnnuel:2800,  rentaBrute:5.5, rentaNette:4.4, evolution1an:0.5,  evolution3ans:10.0, evolution5ans:28.0, budgetMedian:178000, apportMoyen:14, surfaceMoyenne:65, piecesMoyennes:3.0 },
  bayonne:            { nom:"Bayonne",               dep:"64", pop:52000,   prixM2Appart:4200, prixM2Maison:5100,  prixMedian:4050,  loyer:14.5, tension:"fort",   delaiVente:58, tauxNego:3.8, volumeAnnuel:1800,  rentaBrute:4.5, rentaNette:3.6, evolution1an:1.5,  evolution3ans:18.0, evolution5ans:42.0, budgetMedian:285000, apportMoyen:20, surfaceMoyenne:68, piecesMoyennes:3.2 },
  annecy:             { nom:"Annecy",                dep:"74", pop:128000,  prixM2Appart:5500, prixM2Maison:6200,  prixMedian:5300,  loyer:17.0, tension:"fort",   delaiVente:52, tauxNego:3.2, volumeAnnuel:2800,  rentaBrute:4.0, rentaNette:3.2, evolution1an:-0.5, evolution3ans:8.5,  evolution5ans:26.0, budgetMedian:365000, apportMoyen:24, surfaceMoyenne:62, piecesMoyennes:2.9 },
  saintEtienne:       { nom:"Saint-Étienne",        dep:"42", pop:171000,  prixM2Appart:1450, prixM2Maison:1350,  prixMedian:1380,  loyer:8.0,  tension:"faible", delaiVente:88, tauxNego:6.5, volumeAnnuel:3800,  rentaBrute:7.5, rentaNette:6.0, evolution1an:0.5,  evolution3ans:5.0,  evolution5ans:15.0, budgetMedian:95000,  apportMoyen:11, surfaceMoyenne:65, piecesMoyennes:3.0 },
  laRochelle:         { nom:"La Rochelle",           dep:"17", pop:77000,   prixM2Appart:3850, prixM2Maison:4650,  prixMedian:3700,  loyer:13.5, tension:"fort",   delaiVente:60, tauxNego:4.0, volumeAnnuel:2400,  rentaBrute:4.8, rentaNette:3.8, evolution1an:-2.5, evolution3ans:10.5, evolution5ans:35.0, budgetMedian:265000, apportMoyen:19, surfaceMoyenne:65, piecesMoyennes:3.0 },
  poitiers:           { nom:"Poitiers",              dep:"86", pop:89000,   prixM2Appart:2050, prixM2Maison:1950,  prixMedian:1950,  loyer:9.2,  tension:"moyen",  delaiVente:78, tauxNego:5.2, volumeAnnuel:2500,  rentaBrute:6.2, rentaNette:4.9, evolution1an:-0.8, evolution3ans:7.5,  evolution5ans:22.0, budgetMedian:145000, apportMoyen:12, surfaceMoyenne:62, piecesMoyennes:3.0 },
};

// -----------------------------------------------------------
// RÉSOLUTION VILLE → DONNÉES
// -----------------------------------------------------------
function normalise(s) {
  return s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[-'\s]+/g, "")
    .replace(/^(saint|ste|st)([a-z])/, "saint$2");
}

function resoudreVille(villeInput, codePostal = null) {
  if (!villeInput) return null;
  const cible = normalise(villeInput);

  for (const [key, data] of Object.entries(MARCHE_PAR_VILLE)) {
    if (normalise(key) === cible || normalise(data.nom) === cible) {
      return { ...data, source: "ville", cle: key };
    }
  }
  for (const [key, data] of Object.entries(MARCHE_PAR_VILLE)) {
    if (normalise(data.nom).includes(cible) || cible.includes(normalise(data.nom))) {
      return { ...data, source: "ville_approx", cle: key };
    }
  }
  if (codePostal) {
    const dep = codePostal.startsWith("97") ? codePostal.slice(0, 3) : codePostal.slice(0, 2);
    if (MARCHE_PAR_DEPARTEMENT[dep]) {
      return { ...MARCHE_PAR_DEPARTEMENT[dep], source: "departement", cle: dep };
    }
  }
  return {
    nom: villeInput, prixM2Appart: 3200, prixM2Maison: 3500, prixMedian: 3050,
    loyer: 11.5, tension: "moyen", delaiVente: 75, tauxNego: 4.8,
    volumeAnnuel: 5000, rentaBrute: 5.5, rentaNette: 4.4,
    evolution1an: -1.5, evolution3ans: 8.0, evolution5ans: 25.0,
    budgetMedian: 210000, apportMoyen: 15, surfaceMoyenne: 62, piecesMoyennes: 3.0,
    source: "defaut",
  };
}

// -----------------------------------------------------------
// DVF — ENDPOINTS + RÉSOLUTION INSEE
// -----------------------------------------------------------
const DVF_ENDPOINTS = [
  (cp, type) => `https://api.cquest.org/dvf?code_postal=${cp}&nature_mutation=Vente&type_local=${type}&rows=200`,
  (cp, type) => `https://api.data.gouv.fr/api/1/datasets/5c4ae55a634f4117716d5656/`,
  (cp, type) => `https://files.data.gouv.fr/geo-dvf/latest/csv/`,
];

async function fetchCodeInsee(ville) {
  try {
    const r = await fetch(`https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(ville)}&fields=code,codesPostaux,population&boost=population&limit=1`);
    const data = await r.json();
    if (data?.[0]) return { codeInsee: data[0].code, codePostal: data[0].codesPostaux?.[0] };
  } catch {}
  return {};
}

async function fetchDVF(codePostal, typeBien) {
  const typeMap = { appartement: "Appartement", maison: "Maison", tous: "Appartement" };
  const type = typeMap[typeBien] || "Appartement";
  const url = `https://api.cquest.org/dvf?code_postal=${codePostal}&nature_mutation=Vente&type_local=${type}&rows=200`;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) return null;
    const data = await r.json();
    return data?.resultats || null;
  } catch { return null; }
}

function calculerStatsDVF(transactions, typeBien) {
  if (!transactions?.length) return null;
  const filtrees = transactions.filter(t => t.valeur_fonciere > 10000 && t.surface_reelle_bati > 10);
  if (filtrees.length < 3) return null;
  const prixM2 = filtrees.map(t => t.valeur_fonciere / t.surface_reelle_bati).filter(p => p > 500 && p < 25000);
  if (!prixM2.length) return null;
  prixM2.sort((a, b) => a - b);
  const moy = Math.round(prixM2.reduce((s, v) => s + v, 0) / prixM2.length);
  const med = Math.round(prixM2[Math.floor(prixM2.length / 2)]);
  return { prixM2Moyen: moy, prixM2Median: med, prixM2Min: Math.round(prixM2[0]), prixM2Max: Math.round(prixM2[prixM2.length - 1]), nbTransactions: filtrees.length, sourceDVF: true };
}

// -----------------------------------------------------------
// GÉNÉRATION DONNÉES ENRICHIES
// -----------------------------------------------------------
function genererDonneesEnrichies(ref, statsDVF, ville, typeBien) {
  const prixM2 = statsDVF?.prixM2Moyen || (typeBien === "maison" ? ref.prixM2Maison : ref.prixM2Appart);
  const prixMedian = statsDVF?.prixM2Median || ref.prixMedian || prixM2 * 0.95;
  const loyer = ref.loyer || 11.5;

  const tranchesLocales = [
    { label: "Entrée de gamme", min: Math.round(prixM2 * 0.65), max: Math.round(prixM2 * 0.85), part: 20 },
    { label: "Standard",        min: Math.round(prixM2 * 0.85), max: Math.round(prixM2 * 1.05), part: 45 },
    { label: "Premium",         min: Math.round(prixM2 * 1.05), max: Math.round(prixM2 * 1.35), part: 25 },
    { label: "Prestige",        min: Math.round(prixM2 * 1.35), max: Math.round(prixM2 * 1.80), part: 10 },
  ];

  const rentaBrute = ref.rentaBrute || parseFloat(((loyer * 12) / prixM2 * 100).toFixed(1));
  const rentaNette = ref.rentaNette || parseFloat((rentaBrute * 0.78).toFixed(1));
  const noteInvest = rentaBrute >= 7 ? "Excellent" : rentaBrute >= 5.5 ? "Bon" : rentaBrute >= 4 ? "Moyen" : "Faible";

  const moisFort = ["mars","avril","mai","septembre","octobre"];
  const moisFaible = ["janvier","août","décembre"];

  return {
    ville: ref.nom || ville,
    departement: ref.dep || ref.departement || "—",
    population: ref.pop || ref.population || null,
    sourceRef: ref.source || "ville",
    sourceDVFActive: !!statsDVF,

    prix: {
      prixM2Moyen: prixM2,
      prixM2Median: prixMedian,
      prixM2Min: statsDVF?.prixM2Min || Math.round(prixM2 * 0.62),
      prixM2Max: statsDVF?.prixM2Max || Math.round(prixM2 * 1.75),
      evolution1an: ref.evolution1an ?? -1.5,
      evolution3ans: ref.evolution3ans ?? 8.0,
      evolution5ans: ref.evolution5ans ?? 25.0,
      tranchesLocales,
      nbTransactionsDVF: statsDVF?.nbTransactions || null,
    },

    marche: {
      tension: ref.tension || "moyen",
      tensionLabel: ref.tension === "fort" ? "🔴 Marché tendu" : ref.tension === "faible" ? "🟢 Marché détendu" : "🟡 Marché équilibré",
      delaiVenteMoyen: ref.delaiVente || 75,
      tauxNegociation: ref.tauxNego || 4.8,
      volumeAnnuel: ref.volumeAnnuel || 5000,
      saisonnalite: { moisForts: moisFort, moisFaibles: moisFaible },
    },

    profilAcheteurs: {
      budgetMedian: ref.budgetMedian || 210000,
      apportMoyen: ref.apportMoyen || 15,
      surfaceMoyenne: ref.surfaceMoyenne || 62,
      piecesMoyennes: ref.piecesMoyennes || 3.0,
      profilSocio: ref.dep === "75" || ref.dep === "92" ? "CSP+ urbain, investisseur" :
                   ref.tension === "fort" ? "Actifs 28-40 ans, primo-accédants" : "Familles, retraités",
      argumentsVente: [
        `Prix m² ${ref.evolution1an > 0 ? "en hausse" : "stabilisé"} sur 1 an`,
        `Délai de vente moyen : ${ref.delaiVente || 75} jours`,
        `Tension marché : ${ref.tension || "moyen"}`,
      ],
    },

    rentabilite: {
      rentaBrute,
      rentaNette,
      loyerM2: loyer,
      noteInvest,
      loyer65m2: Math.round(loyer * 65),
      valeurEstimee65m2: Math.round(prixM2 * 65),
    },

    territoire: {
      population: ref.pop || ref.population || null,
      departement: ref.dep || ref.departement,
      sourceData: "DVF Notaires + INSEE / FNAIM 2024",
      miseAJour: "T4 2024",
    },

    prospection: {
      meilleuresPeriodes: moisFort,
      argumentPrix: `${prixM2.toLocaleString("fr-FR")} €/m² en moyenne`,
      scoreMarche: ref.tension === "fort" ? 85 : ref.tension === "faible" ? 42 : 62,
    },

    conseilsAgent: genererConseils(ref, prixM2),
  };
}

function genererConseils(ref, prixM2) {
  const conseils = [];
  if (ref.tension === "fort") {
    conseils.push("📈 Marché tendu : argumenter sur la rapidité de vente, proposer des estimations offensives.");
    conseils.push("🎯 Cibler les vendeurs avec des biens depuis >90 jours en mandat exclusif.");
  } else if (ref.tension === "faible") {
    conseils.push("📉 Marché détendu : mettre en avant la qualité du bien et son rapport qualité/prix.");
    conseils.push("🏷️ Travailler les prix avec soin — le taux de négociation dépasse " + (ref.tauxNego || 5) + " %.");
  } else {
    conseils.push("⚖️ Marché équilibré : miser sur la réactivité et la qualité de la présentation.");
  }
  if (ref.rentaBrute >= 6) {
    conseils.push("💰 Rentabilité attractive (" + ref.rentaBrute + "% brut) — fort potentiel investisseurs locatifs.");
  }
  if (ref.evolution5ans > 30) {
    conseils.push("📊 +"+ref.evolution5ans+"% en 5 ans : argument fort pour les vendeurs hésitants (plus-value réalisée).");
  }
  conseils.push("🗓️ Meilleures périodes de prospection : mars-mai et septembre-octobre.");
  return conseils;
}

// -----------------------------------------------------------
// CACHE SUPABASE
// -----------------------------------------------------------
async function getCache(key) {
  try {
    const { data } = await supabase.from("dvf_cache").select("resultats, cached_at").eq("cache_key", key).single();
    if (!data) return null;
    const age = (Date.now() - new Date(data.cached_at).getTime()) / 3600000;
    return age < 12 ? data.resultats : null;
  } catch { return null; }
}

async function setCache(key, ville, resultats) {
  try {
    await supabase.from("dvf_cache").upsert({ cache_key: key, ville, resultats, cached_at: new Date().toISOString() });
  } catch {}
}

// -----------------------------------------------------------
// HANDLER PRINCIPAL
// -----------------------------------------------------------
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { ville, typeBien = "appartement", codePostal } = req.body;
  if (!ville) return res.status(400).json({ error: "Paramètre 'ville' requis" });

  const cacheKey = `immo_${normalise(ville)}_${typeBien}`;
  const cached = await getCache(cacheKey);
  if (cached) return res.status(200).json({ ...cached, fromCache: true });

  // 1. Résoudre ville
  const ref = resoudreVille(ville, codePostal);

  // 2. Résoudre code postal pour DVF
  let cp = codePostal;
  const geo = await fetchCodeInsee(ville);

  // Validation : si la ville n'est pas dans notre base ET que geo.api ne la trouve pas → ville invalide
  if (!ref || ref.source === 'defaut') {
    if (!geo.codeInsee) {
      return res.status(404).json({ error: `Ville "${ville}" introuvable. Vérifiez l'orthographe.` });
    }
  }

  if (!cp) {
    cp = geo.codePostal;
  }

  // 3. Tenter DVF live
  let statsDVF = null;
  if (cp) {
    const transactions = await fetchDVF(cp, typeBien);
    if (transactions) {
      statsDVF = calculerStatsDVF(transactions, typeBien);
      // Sauvegarder les transactions brutes
      if (transactions.length > 0) {
        try {
          const rows = transactions.slice(0, 50).map(t => ({
            adresse: [t.no_voie, t.type_de_voie, t.voie, t.commune].filter(Boolean).join(" "),
            ville: t.commune || ville,
            code_postal: cp,
            prix: t.valeur_fonciere,
            surface: t.surface_reelle_bati,
            type_bien: t.type_local,
            date_mutation: t.date_mutation,
            nb_pieces: t.nombre_pieces_principales,
          })).filter(r => r.prix && r.surface);
          if (rows.length) await supabase.from("biens").upsert(rows, { onConflict: "adresse,date_mutation" });
        } catch {}
      }
    }
  }

  // 4. Générer données enrichies
  const resultats = genererDonneesEnrichies(ref, statsDVF, ville, typeBien);

  // Compat stats legacy
  const stats = {
    prixMoyen: resultats.prix.prixM2Moyen,
    prixMedian: resultats.prix.prixM2Median,
    prixMin: resultats.prix.prixM2Min,
    prixMax: resultats.prix.prixM2Max,
    nbTransactions: statsDVF?.nbTransactions || 0,
    sourceDVF: !!statsDVF,
  };

  const reponse = { stats, ...resultats };
  await setCache(cacheKey, ville, reponse);

  // Log
  try { await supabase.from("scraper_logs").insert({ source: "immobilier_api", ville, statut: "ok", nb_resultats: stats.nbTransactions }); } catch {}

  return res.status(200).json(reponse);
}
