const fs = require('node:fs');
const assert = require('node:assert/strict');
const api = require('../src/territory-brand-maps.js');
const html = fs.readFileSync('index.html', 'utf8');

// Exploration cells → top 3 per state, shares over the full state total (others included).
const cells = [
  {x: 'SP', series: 'VW', observedCount: 300, categoryDenominator: 1000},
  {x: 'SP', series: 'FIAT', observedCount: 200, categoryDenominator: 1000},
  {x: 'SP', series: 'BYD', observedCount: 250, categoryDenominator: 1000},
  {x: 'SP', series: 'GM', observedCount: 100, categoryDenominator: 1000},
  {x: 'SP', series: 'Outras marcas', observedCount: 150, categoryDenominator: 1000},
  {x: 'Outras UFs', series: 'FIAT', observedCount: 9, categoryDenominator: 9}
];
const tops = api.tbmTops({cells, seriesOthersLabel: 'Outras marcas'});
assert.deepEqual(tops.get('SP').top.map(t => t.b), ['VW', 'BYD', 'FIAT']);
assert.equal(tops.get('SP').top[0].s, .3);
assert(!tops.has('Outras UFs'), 'only real UFs');
assert.equal(api.tbmTops(null), null);

// Fixed brand colors; unknown brands are neutral and keep a readable name.
assert.equal(api.tbmColor('FIAT'), 'var(--chart-1)');
assert.equal(api.tbmColor('VW'), 'var(--chart-2)');
assert.equal(api.tbmColor('BYD'), 'var(--chart-3)');
assert.equal(api.tbmColor('GM'), 'var(--tbm-other)');
assert.equal(api.tbmName('CAOA CHERY'), 'Caoa Chery');
assert.equal(api.tbmName('XPTO'), 'Xpto');

// Projection: the land centre stays at the canvas centre whatever the rotation.
// (The geometry samples every fourth vertex, so compare against its own centre.)
const edge = [];for (let t = 0; t < 100; t += 5) edge.push(t, 0, 100, t, 100 - t, 100, 0, 100 - t);
const square = [{n: edge}];
const geo = api.tbmGeometry(square);
for (const yaw of [0, 45, 90, 180]) {
  const pr = api.tbmProjection({yaw, tilt: 55}, geo, 600, 200);
  const [x] = pr.P(geo.C[0], geo.C[1]);
  assert(Math.abs(x - 300) < 1e-9, 'centred at yaw ' + yaw);
  const [a, b, c, d] = pr.mat(1);
  assert(Math.abs(a * d - b * c - pr.s * pr.s * pr.ky) < 1e-9, 'rotation + tilt keeps area scale');
}

// Embedded once, mounted on Territórios, with the national points file present.
assert.equal(html.match(/\/\/ BEGIN TERRITORY BRAND MAPS/g)?.length, 1);
assert.equal(html.match(/jsxRuntime\.jsx\(TerritoryBrandMaps,/g)?.length, 1);
const points = JSON.parse(fs.readFileSync('data/geography/municipal-points.json', 'utf8'));
assert.equal(points.version, 1);
assert(points.rows.length >= 5570);
console.log('territory brand maps: top 3, colors, projection and embedding verified');

// Brand strength: share in the state ÷ national share × 100.
const strength = api.tbmStrength({cells: [
  {x: 'SP', series: 'MITSUBISHI', observedCount: 10, categoryDenominator: 1000},
  {x: 'GO', series: 'MITSUBISHI', observedCount: 30, categoryDenominator: 1000},
  {x: 'GO', series: 'FIAT', observedCount: 300, categoryDenominator: 1000}]}, 'MITSUBISHI');
assert.equal(strength.national, .02);
assert.equal(Math.round(strength.rows.get('SP').index), 50);
assert.equal(Math.round(strength.rows.get('GO').index), 150);
assert.equal(api.tbmStrength({cells: []}, 'MITSUBISHI'), null);
console.log('territory brand maps: brand strength index verified');
