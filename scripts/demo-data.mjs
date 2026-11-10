// Erzeugt Demo-Produkte, bis der L-Shop-API-Key da ist. Wird durch `npm run sync` ersetzt.
import fs from 'node:fs';

const slug = (s) => s.toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const COLORS = [
  ['Weiß','#ffffff'],['Schwarz','#111111'],['Navy','#1f2a44'],['Rot','#c62828'],['Royalblau','#1e56c9'],
  ['Grau meliert','#9e9e9e'],['Flaschengrün','#1b5e20'],['Gelb','#f9d71c'],['Orange','#ef6c00'],['Bordeaux','#6d1a2a'],
];
const SIZES_ADULT = ['XS','S','M','L','XL','XXL','3XL'];
const SIZES_KIDS = ['98/104','110/116','122/128','134/140','146/152'];
const BRANDS = ['Demo Basics','Demo Premium','Demo Organic','Demo Sport','Demo Workwear'];

const TYPES = [
  { cat: 'T-Shirts', items: ['Basic T-Shirt','Heavy T-Shirt','Bio T-Shirt','V-Neck T-Shirt','Langarm T-Shirt','Slim Fit T-Shirt','Funktions T-Shirt'], price: [1.9, 6.5], mat: '100 % Baumwolle', tags: ['shirt','tee'] },
  { cat: 'Poloshirts', items: ['Piqué Poloshirt','Stretch Poloshirt','Bio Poloshirt','Langarm Poloshirt','Funktions Poloshirt'], price: [5.5, 14], mat: '65 % Polyester, 35 % Baumwolle', tags: ['polo'] },
  { cat: 'Sweatshirts', items: ['Raglan Sweatshirt','Classic Sweatshirt','Bio Sweatshirt','Sweatjacke mit Zipper'], price: [8, 18], mat: '80 % Baumwolle, 20 % Polyester', tags: ['pullover','pulli'] },
  { cat: 'Hoodies', items: ['Kapuzenpullover Classic','Hoodie Heavy','Bio Hoodie','Zip Hoodie','Kapuzensweatjacke'], price: [11, 26], mat: '80 % Baumwolle, 20 % Polyester', tags: ['kapuze','kapuzenpullover'] },
  { cat: 'Jacken', items: ['Softshelljacke','Fleecejacke','Steppjacke','Regenjacke','Bodywarmer Weste'], price: [14, 45], mat: '100 % Polyester', tags: ['jacke','outdoor'] },
  { cat: 'Caps & Mützen', items: ['Baseball Cap 5-Panel','Trucker Cap','Beanie Strickmütze','Bucket Hat'], price: [1.8, 7], mat: '100 % Baumwolle', tags: ['cap','muetze','kappe'] },
  { cat: 'Taschen', items: ['Baumwolltasche lange Henkel','Jutebeutel','Turnbeutel','Rucksack City','Shopper Bio'], price: [0.9, 16], mat: 'Baumwolle', tags: ['bag','beutel','tasche'] },
  { cat: 'Arbeitskleidung', items: ['Arbeits T-Shirt','Kochjacke','Latzschürze','Bundhose Workwear','Warnweste'], price: [3, 32], mat: '65 % Polyester, 35 % Baumwolle', tags: ['workwear','gastro'] },
  { cat: 'Handtücher', items: ['Frottee Handtuch 50x100','Duschtuch 70x140','Gästetuch 30x50','Sporthandtuch'], price: [1.5, 12], mat: '100 % Baumwolle, 450 g/m²', tags: ['towel','frottee'] },
];
const GENDERS = ['Herren','Damen','Unisex','Kinder'];

let rnd = 42; const r = () => ((rnd = (rnd * 16807) % 2147483647) / 2147483647);
const pick = (a, n) => [...a].sort(() => r() - 0.5).slice(0, n);

const products = [];
let n = 1000;
for (const t of TYPES) {
  for (const item of t.items) {
    for (const g of (['Taschen','Caps & Mützen','Handtücher'].includes(t.cat) ? ['Unisex'] : pick(GENDERS, 2))) {
      n++;
      const brand = item.startsWith('Bio') ? 'Demo Organic' : BRANDS[Math.floor(r() * BRANDS.length)];
      const name = g === 'Unisex' ? item : `${item} ${g}`;
      const colors = pick(COLORS, 3 + Math.floor(r() * 6)).map(([name, hex]) => ({ name, hex }));
      const sizes = ['Taschen','Caps & Mützen','Handtücher'].includes(t.cat) ? ['One Size'] : g === 'Kinder' ? SIZES_KIDS : SIZES_ADULT.slice(0, 5 + Math.floor(r() * 3));
      const base = +(t.price[0] + r() * (t.price[1] - t.price[0])).toFixed(2);
      products.push({
        id: `D${n}`, sku: `DEMO-${n}`, name, brand, category: t.cat, categorySlug: slug(t.cat),
        description: `${name} von ${brand}. Ideal für Veredelung per Druck oder Stick. ${t.mat}. Pflegeleicht und formstabil – perfekt für Teams, Vereine, Events und Merchandising.`,
        material: t.mat, gender: g, basePrice: base, images: [], colors, sizes,
        stock: Math.floor(r() * 5000), tags: [...t.tags, ...(item.startsWith('Bio') ? ['bio','organic','nachhaltig'] : [])],
      });
    }
  }
}
fs.writeFileSync(new URL("../seed/products.demo.json", import.meta.url), JSON.stringify(products, null, 1));
console.log(`${products.length} Demo-Produkte geschrieben.`);
