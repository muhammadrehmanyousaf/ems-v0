const fs = require('fs');

const lines = fs.readFileSync('c:/Projects/ems-v0/gsc-export-pages.txt', 'utf8').split('\n');
const pages = [];
for (let line of lines) {
  if (!line.startsWith('https://')) continue;
  const parts = line.split('|').map(s => s.trim());
  if (parts.length >= 5) {
    const url = parts[0];
    const clicks = parseInt(parts[1], 10);
    const impressions = parseInt(parts[2], 10);
    const ctr = parseFloat(parts[3].replace('%', ''));
    const position = parseFloat(parts[4]);
    pages.push({ url, clicks, impressions, ctr, position });
  }
}

// Find top content / guide / city opportunity pages (impressions >= 100)
const opps = pages
  .filter(p => p.impressions >= 100)
  .sort((a, b) => b.impressions - a.impressions);

console.log('Total pages analyzed:', pages.length);
console.log('Top opportunities (high impression):');
console.log(JSON.stringify(opps.slice(0, 30), null, 2));
