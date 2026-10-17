const fs = require('node:fs');
const assert = require('node:assert/strict');
const api = require('../src/competitive-reading.js');
const html = fs.readFileSync('index.html', 'utf8');

// Model ranking: shares over the whole set, Mitsubishi flagged by brand identity or known group.
const models = api.crModelRanking({categoryOthersLabel: 'Outros', observedTotal: 1000, modelBrandIdentities: [{model: 'TRITON', brands: ['MITSUBISHI']}, {model: 'HILUX', brands: ['TOYOTA']}],
  cells: [{x: 'HILUX', observedCount: 300}, {x: 'TRITON', observedCount: 90}, {x: 'L200', observedCount: 10}, {x: 'Outros', observedCount: 600}]});
assert.deepEqual(models.rows.map(r => [r.model, r.rank, r.share, r.mitsubishi]), [['HILUX', 1, .3, false], ['TRITON', 2, .09, true], ['L200', 3, .01, true]]);
assert.equal(api.crModelRanking(null), null);

// UF matrix: set size per UF, Mitsubishi share, medians and quadrants.
const m = api.crStateMatrix({cells: [
  {x: 'SP', series: 'TOYOTA', observedCount: 500, categoryDenominator: 1000}, {x: 'SP', series: 'MITSUBISHI', observedCount: 50, categoryDenominator: 1000},
  {x: 'MG', series: 'MITSUBISHI', observedCount: 150, categoryDenominator: 900},
  {x: 'AC', series: 'MITSUBISHI', observedCount: 20, categoryDenominator: 100},
  {x: 'RR', series: 'TOYOTA', observedCount: 50, categoryDenominator: 80},
  {x: 'Outras UFs', series: 'MITSUBISHI', observedCount: 1, categoryDenominator: 9}]});
assert.equal(m.rows.length, 4, 'only real UFs');
const q = Object.fromEntries(m.rows.map(r => [r.uf, api.crQuadrant(r, m)]));
assert.deepEqual(q, {SP: 'opportunity', MG: 'defend', AC: 'niche', RR: 'watch'});
assert.equal(m.rows.find(r => r.uf === 'RR').share, 0, 'no Mitsubishi cell means zero share');

// Competitive sets follow the BD classes of the portfolio; mounted once on Concorrência.
assert.deepEqual(api.CR_SETS.map(s => s.filters), [{bd_segmento: 'PICK-UP MID'}, {bd_segmento: 'COMPACT', bd_carroceria: 'SUV'}, {bd_segmento: 'MID', bd_carroceria: 'SUV'}]);
assert.equal(html.match(/jsxRuntime\.jsx\(CompetitiveReading,/g)?.length, 1);
console.log('competitive reading: ranking, UF matrix, quadrants and sets verified');
